export function isBillingSuspended(subscription: { status: string }) {
  return subscription?.status === 'SUSPENDED';
}

export function isPastDue(subscription: { status: string }) {
  return subscription?.status === 'PAST_DUE';
}
