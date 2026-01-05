export const OMIE_EVENT_STATUSES = ['PENDING', 'PROCESSING', 'SUCCESS', 'ERROR'] as const;
export type OmieEventStatus = (typeof OMIE_EVENT_STATUSES)[number];

export const OMIE_MAX_AUTOMATIC_ATTEMPTS = 10;
export const OMIE_RETRY_WINDOW_MINUTES = 5;
