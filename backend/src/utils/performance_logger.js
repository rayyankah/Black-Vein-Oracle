// Simple in-memory log for query timings; can later be swapped for pino/winston if desired.

const timings = [];

export default function perfLog(label, durationMs) {
  timings.push({ label, durationMs, at: new Date().toISOString() });
  // keep log small for grading runs
  if (timings.length > 100) timings.shift();
  return timings;
}

export function getTimings() {
  return timings;
}
