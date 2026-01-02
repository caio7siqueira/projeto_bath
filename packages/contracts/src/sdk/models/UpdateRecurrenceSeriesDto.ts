/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateRecurrenceSeriesDto = {
    rule?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM_INTERVAL';
    /**
     * Intervalo em dias para CUSTOM_INTERVAL
     */
    interval?: number;
    startDate?: string;
    endDate?: string;
};

