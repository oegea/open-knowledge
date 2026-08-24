import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import en from '../../src/i18n/dictionaries/en.json';
import { RsvpReader } from '../../src/components/study/RsvpReader';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}));

const WORDS = ['El', 'sistema', 'solar.', 'Tiene', 'planetas.'];

function wrap(children: ReactNode) {
  return (
    <I18nProvider locale="en" dictionary={en}>
      {children}
    </I18nProvider>
  );
}

function renderReader(overrides: Partial<Parameters<typeof RsvpReader>[0]> = {}) {
  const props = {
    title: 'El Sistema Solar',
    words: WORDS,
    hasNext: true,
    onClose: jest.fn(),
    onFinished: jest.fn(),
    onNext: jest.fn(),
    ...overrides,
  };
  const utils = render(wrap(<RsvpReader {...props} />));
  return { ...utils, props };
}

/**
 * Each frame schedules the next timeout only after React re-renders, so
 * reaching the end takes one act() per word, not one big time jump.
 */
function playToTheEnd() {
  fireEvent.click(screen.getByRole('button', { name: 'Play' }));
  for (let frame = 0; frame <= WORDS.length; frame += 1) {
    act(() => jest.advanceTimersByTime(5000));
  }
}

/** The reader splits the word around the ORP: match on the dialog's text. */
function visibleWord(): string {
  const dialog = screen.getByRole('dialog', { name: 'Speed reading (RSVP)' });
  return dialog.textContent ?? '';
}

describe('RsvpReader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Behaviour', () => {
    it('opens paused on the first word, with the tap hint', () => {
      renderReader();

      expect(screen.getByRole('dialog', { name: 'Speed reading (RSVP)' })).toBeInTheDocument();
      expect(visibleWord()).toContain('El');
      expect(screen.getByText('Tap the screen to play or pause')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('advances word by word while playing', () => {
      renderReader();

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

      act(() => jest.advanceTimersByTime(250));
      expect(visibleWord()).toContain('sistema');
    });

    it('toggles play/pause by tapping anywhere on the stage', () => {
      renderReader();

      fireEvent.click(screen.getByRole('dialog', { name: 'Speed reading (RSVP)' }));
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('dialog', { name: 'Speed reading (RSVP)' }));
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('shows elapsed and remaining time while reading', () => {
      renderReader();

      expect(screen.getByLabelText('Time elapsed')).toHaveTextContent('0:00');
      expect(screen.getByLabelText('Time remaining')).not.toHaveTextContent('−0:00');
    });

    it('completes the material and invites to the next one at the end', () => {
      const { props } = renderReader();

      playToTheEnd();

      expect(props.onFinished).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Material completed!')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Go to the next material' }));
      expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    it('steps one word back and forward with the arrow keys', () => {
      renderReader();

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(visibleWord()).toContain('sistema');

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(visibleWord()).toContain('solar.');

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(visibleWord()).toContain('sistema');

      // The start clamps: stepping back twice more stays on the first word.
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(visibleWord()).not.toContain('sistema');
    });

    it('leaves arrow keys to the browser while the position slider is focused', () => {
      renderReader();

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Reading position' }), {
        key: 'ArrowRight',
      });

      // The global handler must not double the slider's own stepping.
      expect(visibleWord()).not.toContain('sistema');
    });

    it('closes reporting the word the reading stopped at', () => {
      const { props } = renderReader();

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => jest.advanceTimersByTime(250));
      fireEvent.click(screen.getByRole('button', { name: 'Exit speed reading' }));

      expect(props.onClose).toHaveBeenCalledWith(1);
    });
  });

  describe('Settings', () => {
    it('changes speed and sentence pause, remembering them on the device', () => {
      renderReader();

      fireEvent.click(screen.getByRole('button', { name: 'Reading settings' }));
      fireEvent.click(screen.getByRole('button', { name: '500 wpm' }));
      fireEvent.click(screen.getByRole('button', { name: 'Long' }));

      // The bottom bar mirrors the choice, so the pressed chip is queried
      // by its toggle state.
      expect(screen.getByRole('button', { name: '500 wpm', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Long', pressed: true })).toBeInTheDocument();
      expect(JSON.parse(window.localStorage.getItem('ok-rsvp-preferences') ?? '{}')).toEqual({
        wpm: 500,
        pause: 'long',
      });
    });

    it('starts from the preferences saved on the device', () => {
      window.localStorage.setItem(
        'ok-rsvp-preferences',
        JSON.stringify({ wpm: 700, pause: 'medium' })
      );

      renderReader();

      expect(screen.getByRole('button', { name: '700 wpm' })).toBeInTheDocument();
    });

    it('falls back to the defaults when the stored value is invalid', () => {
      window.localStorage.setItem('ok-rsvp-preferences', 'not json');

      renderReader();

      expect(screen.getByRole('button', { name: '300 wpm' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders nothing without words', () => {
      renderReader({ words: [] });

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('does not toggle playback while the completion screen is shown', () => {
      const { props } = renderReader();

      playToTheEnd();
      expect(screen.getByText('Material completed!')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('dialog', { name: 'Speed reading (RSVP)' }));
      expect(screen.getByText('Material completed!')).toBeInTheDocument();
      expect(props.onFinished).toHaveBeenCalledTimes(1);
    });
  });
});
