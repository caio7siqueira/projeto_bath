// RecurrenceRule é string (enum Prisma não exporta tipo TS)

export function generateRecurrenceDates(rule: string, interval: number | undefined, startDate: string, endDate: string) {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    let next;
    switch (rule) {
      case 'WEEKLY':
        next = new Date(current);
        next.setDate(current.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next = new Date(current);
        next.setDate(current.getDate() + 14);
        break;
      case 'MONTHLY':
        next = new Date(current);
        next.setMonth(current.getMonth() + 1);
        break;
      case 'CUSTOM_INTERVAL':
        next = new Date(current);
        next.setDate(current.getDate() + (interval || 1));
        break;
      default:
        throw new Error('Regra de recorrência inválida');
    }
    dates.push({ startsAt: new Date(current), endsAt: new Date(current) });
    current = next;
  }
  return dates;
}
