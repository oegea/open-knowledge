import { formatClock } from '../../src/components/study/formatClock';

describe('formatClock', () => {
  it('formats seconds as m:ss and h:mm:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65.7)).toBe('1:05');
    expect(formatClock(738.66)).toBe('12:18');
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('treats NaN, Infinity and negatives as zero', () => {
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatClock(-4)).toBe('0:00');
  });
});
