import { act, render, screen } from '@testing-library/react';
import { MotionEffects } from '@/components/ui/MotionEffects';

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

function mockMatchMedia(matches: Record<string, boolean>) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: Object.entries(matches).some(([key, value]) => query.includes(key) && value),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

describe('MotionEffects', () => {
  let intersect: ObserverCallback;
  const observe = jest.fn();
  const unobserve = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    observe.mockClear();
    unobserve.mockClear();
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    window.IntersectionObserver = jest.fn().mockImplementation((callback: ObserverCallback) => {
      intersect = callback;
      return { observe, unobserve, disconnect: jest.fn() };
    }) as unknown as typeof IntersectionObserver;
    // jsdom has no layout: each element reports the position in data-top.
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const top = Number(this.dataset.top ?? 0);
        return { top, left: 20, width: 300, height: 120, bottom: top + 120, right: 320 } as DOMRect;
      });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function renderPage() {
    return render(
      <>
        <p data-reveal data-top="100">
          On screen
        </p>
        <p data-reveal data-top="1400">
          Below the fold
        </p>
        <MotionEffects />
      </>
    );
  }

  it('hides only content below the fold, then reveals it when it scrolls into view', () => {
    mockMatchMedia({ 'prefers-reduced-motion': false });
    renderPage();

    const onScreen = screen.getByText('On screen');
    const below = screen.getByText('Below the fold');
    expect(onScreen).not.toHaveAttribute('data-reveal-state');
    expect(below).toHaveAttribute('data-reveal-state', 'pending');
    expect(observe).toHaveBeenCalledWith(below);

    act(() => intersect([{ isIntersecting: true, target: below }]));
    expect(below).toHaveAttribute('data-reveal-state', 'run');
    expect(unobserve).toHaveBeenCalledWith(below);

    // Once the transition is over the element is handed back untouched.
    act(() => jest.advanceTimersByTime(1000));
    expect(below).toHaveAttribute('data-reveal-state', 'done');
    expect(below.style.getPropertyValue('--ok-reveal-delay')).toBe('');
  });

  it('staggers elements that enter the viewport together', () => {
    mockMatchMedia({ 'prefers-reduced-motion': false });
    render(
      <>
        <p data-reveal data-top="1400">
          First
        </p>
        <p data-reveal data-top="1400">
          Second
        </p>
        <MotionEffects />
      </>
    );

    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    act(() =>
      intersect([
        { isIntersecting: true, target: first },
        { isIntersecting: true, target: second },
      ])
    );
    expect(first.style.getPropertyValue('--ok-reveal-delay')).toBe('0ms');
    expect(second.style.getPropertyValue('--ok-reveal-delay')).toBe('70ms');
  });

  it('leaves everything visible when the user prefers reduced motion', () => {
    mockMatchMedia({ 'prefers-reduced-motion': true });
    renderPage();

    expect(screen.getByText('Below the fold')).not.toHaveAttribute('data-reveal-state');
    expect(observe).not.toHaveBeenCalled();
  });

  it('tracks the cursor over spotlight surfaces on fine pointers', () => {
    mockMatchMedia({ 'prefers-reduced-motion': true, hover: true });
    render(
      <>
        <a href="https://example.org" data-spotlight data-top="100">
          Card
        </a>
        <MotionEffects />
      </>
    );

    const card = screen.getByRole('link', { name: 'Card' });
    const event = new MouseEvent('pointermove', { bubbles: true, clientX: 120, clientY: 160 });
    act(() => {
      card.dispatchEvent(event);
    });
    expect(card.style.getPropertyValue('--ok-mx')).toBe('100px');
    expect(card.style.getPropertyValue('--ok-my')).toBe('60px');
  });
});
