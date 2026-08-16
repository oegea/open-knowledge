/** "m:ss" (or "h:mm:ss") for player read-outs; NaN/Infinity render as 0:00. */
export function formatClock(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const mmss = `${minutes}:${String(rest).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : mmss;
}
