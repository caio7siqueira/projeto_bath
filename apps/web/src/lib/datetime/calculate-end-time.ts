const MINUTES_IN_MILLISECOND = 60_000;

const pad = (value: number) => String(value).padStart(2, '0');

function formatLocalDateTimeInput(date: Date): string {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

function isValidDuration(durationMinutes: number | undefined): durationMinutes is number {
  return typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) && durationMinutes > 0;
}

export function calculateEndDateTime(start: string, durationMinutes?: number): string | null {
  if (!start || !isValidDuration(durationMinutes)) {
    return null;
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const resultDate = new Date(startDate.getTime() + durationMinutes * MINUTES_IN_MILLISECOND);
  return formatLocalDateTimeInput(resultDate);
}

export { formatLocalDateTimeInput };
