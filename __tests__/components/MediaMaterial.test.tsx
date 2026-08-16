import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, Fragment, ReactNode } from 'react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import en from '../../src/i18n/dictionaries/en.json';
import * as MaterialMother from '../../src/modules/course/test/helpers/MaterialMother';
import { MediaMaterial } from '../../src/components/study/MediaMaterial';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}));

// react-markdown is ESM-only; this double renders one <p> per paragraph and
// runs the real rehype plugins over a minimal hast tree, so the word-span
// pipeline under test is the production one.
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children, rehypePlugins }: { children: string; rehypePlugins?: (() => (tree: unknown) => void)[] }) => {
    type Node = { type: string; value?: string; tagName?: string; properties?: Record<string, string>; children?: Node[] };
    const tree: Node = {
      type: 'root',
      children: children.split(/\n\n+/).map((paragraph) => ({
        type: 'element',
        tagName: 'p',
        children: [{ type: 'text', value: paragraph }],
      })),
    };
    (rehypePlugins ?? []).forEach((plugin) => plugin()(tree));
    const toReact = (node: Node, key: number): ReactNode => {
      if (node.type === 'text') return node.value;
      const props: Record<string, unknown> = { key };
      Object.entries(node.properties ?? {}).forEach(([name, value]) => {
        props[name === 'dataWord' ? 'data-word' : name] = value;
      });
      return createElement(node.tagName ?? Fragment, props, ...(node.children ?? []).map(toReact));
    };
    return createElement('div', null, ...(tree.children ?? []).map(toReact));
  },
}));

const NOTES = 'El agua empezó a moverse.\n\nNadie se lo había pedido.';
const TRANSCRIPT = {
  words: ['El', 'agua', 'empezó', 'a', 'moverse.', 'Nadie', 'se', 'lo', 'había', 'pedido.'].map((text, index) => ({
    text,
    start: index,
    end: index + 0.8,
  })),
};

/** jsdom ships no fetch/Response: a minimal double is enough for the JSON transcript. */
function mockFetch(body: unknown): typeof fetch {
  return jest.fn(async () => ({
    ok: body !== null,
    status: body !== null ? 200 : 404,
    json: async () => body,
  })) as unknown as typeof fetch;
}

let intersectionCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

function renderMaterial(overrides: Parameters<typeof MaterialMother.createPrimitive>[0] = {}) {
  const dock = document.createElement('div');
  document.body.appendChild(dock);
  const material = MaterialMother.createPrimitive({
    id: 'audio-1',
    title: 'Historia — El riego fantasma',
    type: 'audio',
    markdown: NOTES,
    mediaPath: '/api/media/audio/a.mp3',
    transcriptPath: '/api/media/transcripts/a.json',
    ...overrides,
  });
  const utils = render(
    <I18nProvider locale="en" dictionary={en}>
      <MediaMaterial material={material} playerDock={dock} />
    </I18nProvider>
  );
  const audio = utils.container.querySelector('audio') as HTMLAudioElement;
  return { ...utils, dock, audio };
}

function setTime(audio: HTMLAudioElement, seconds: number) {
  Object.defineProperty(audio, 'currentTime', { value: seconds, writable: true, configurable: true });
  fireEvent(audio, new Event('timeupdate'));
}

describe('MediaMaterial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch(TRANSCRIPT);
    Element.prototype.scrollIntoView = jest.fn();
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = jest.fn();
    intersectionCallback = null;
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersectionCallback = callback;
      }
      observe() {}
      disconnect() {}
    };
  });

  describe('Basic Behaviour', () => {
    it('plays without a transcript exactly like before: player plus plain notes', async () => {
      const { container } = renderMaterial({ transcriptPath: null });

      expect(container.querySelector('audio')).toHaveAttribute('src', '/api/media/audio/a.mp3');
      expect(screen.getByText('El agua empezó a moverse.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(container.querySelector('[data-word]')).toBeNull();
    });

    it('highlights the narrated word as playback advances', async () => {
      const { audio } = renderMaterial();
      await waitFor(() => expect(screen.getByText('empezó')).toBeInTheDocument());

      act(() => setTime(audio, 2.3));

      expect(screen.getByText('empezó')).toHaveAttribute('aria-current', 'true');
      expect(screen.getByText('agua')).not.toHaveAttribute('aria-current');

      act(() => setTime(audio, 8.1));
      expect(screen.getByText('había')).toHaveAttribute('aria-current', 'true');
      expect(screen.getByText('empezó')).not.toHaveAttribute('aria-current');
    });

    it('seeks the media when a narrated word is tapped', async () => {
      const { audio } = renderMaterial();
      await waitFor(() => expect(screen.getByText('Nadie')).toBeInTheDocument());
      let seeked = -1;
      Object.defineProperty(audio, 'currentTime', {
        get: () => 0,
        set: (value: number) => {
          seeked = value;
        },
        configurable: true,
      });

      fireEvent.click(screen.getByText('Nadie'));

      expect(seeked).toBe(5);
      expect(screen.getByText('Nadie')).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Mini player', () => {
    it('stays out of the way while the audio was never played', () => {
      const { dock } = renderMaterial({ transcriptPath: null });

      act(() => intersectionCallback?.([{ isIntersecting: false }]));

      expect(within(dock).queryByRole('region')).toBeNull();
    });

    it('docks compact controls in the header while a started player is scrolled away', async () => {
      const { audio, dock } = renderMaterial({ transcriptPath: null });
      expect(within(dock).queryByRole('region')).toBeNull();
      act(() => setTime(audio, 12));

      act(() => intersectionCallback?.([{ isIntersecting: false }]));

      const region = within(dock).getByRole('region', { name: /now playing/i });
      expect(within(region).getByText('Historia — El riego fantasma')).toBeInTheDocument();
      fireEvent.click(within(region).getByRole('button', { name: /^play$/i }));
      expect(audio.play).toHaveBeenCalled();

      Object.defineProperty(audio, 'paused', { value: false, configurable: true });
      fireEvent(audio, new Event('play'));
      expect(within(region).getByRole('button', { name: /pause/i })).toHaveAttribute('aria-pressed', 'true');

      // Back in view: the strip plays its exit animation, then unmounts.
      act(() => intersectionCallback?.([{ isIntersecting: true }]));
      await waitFor(() => expect(within(dock).queryByRole('region')).toBeNull());
    });

    it('scrolls back to the player from the docked title', async () => {
      const { audio, dock } = renderMaterial({ transcriptPath: null });
      act(() => setTime(audio, 12));
      act(() => intersectionCallback?.([{ isIntersecting: false }]));

      fireEvent.click(within(dock).getByRole('button', { name: /riego fantasma/i }));

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }));
    });
  });

  describe('Following the narration', () => {
    it('stops following on a manual scroll and offers to resume', async () => {
      const { audio } = renderMaterial();
      await waitFor(() => expect(screen.getByText('empezó')).toBeInTheDocument());
      Object.defineProperty(audio, 'paused', { value: false, configurable: true });
      act(() => {
        fireEvent(audio, new Event('play'));
      });
      expect(screen.queryByRole('button', { name: /follow the narration/i })).toBeNull();

      act(() => {
        fireEvent.wheel(window);
      });

      const chip = screen.getByRole('button', { name: /follow the narration/i });
      fireEvent.click(chip);
      expect(screen.queryByRole('button', { name: /follow the narration/i })).toBeNull();
    });
  });

  describe('Following from the mini player', () => {
    it('moves the follow control into the docked strip and resumes from there', async () => {
      const { audio, dock } = renderMaterial();
      await waitFor(() => expect(screen.getByText('empezó')).toBeInTheDocument());
      Object.defineProperty(audio, 'paused', { value: false, configurable: true });
      act(() => {
        fireEvent(audio, new Event('play'));
      });
      act(() => setTime(audio, 2.3));
      act(() => intersectionCallback?.([{ isIntersecting: false }]));
      const region = within(dock).getByRole('region', { name: /now playing/i });
      expect(within(region).queryByRole('button', { name: /follow the narration/i })).toBeNull();

      act(() => {
        fireEvent.wheel(window);
      });

      const docked = within(region).getByRole('button', { name: /follow the narration/i });
      // Exactly one control: docked, no floating chip on top of it.
      expect(screen.getAllByRole('button', { name: /follow the narration/i })).toHaveLength(1);
      fireEvent.click(docked);
      expect(within(region).queryByRole('button', { name: /follow the narration/i })).toBeNull();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('falls back to plain notes when the transcript does not match the text', async () => {
      global.fetch = mockFetch({
        words: [
          { text: 'completamente', start: 0, end: 1 },
          { text: 'distinto', start: 1, end: 2 },
        ],
      });
      const { audio } = renderMaterial();
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      await act(async () => {});

      act(() => setTime(audio, 1.5));

      expect(document.querySelector('[aria-current="true"]')).toBeNull();
    });

    it('keeps plain playback when the transcript cannot be loaded', async () => {
      global.fetch = mockFetch(null);
      const { audio } = renderMaterial();
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      await act(async () => {});

      act(() => setTime(audio, 1.5));

      expect(screen.getByText('El agua empezó a moverse.')).toBeInTheDocument();
      expect(document.querySelector('[aria-current="true"]')).toBeNull();
    });
  });
});
