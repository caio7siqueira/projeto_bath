/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateRecurrenceSeriesDto = {
    rule: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM_INTERVAL';
    /**
     * Intervalo em dias para CUSTOM_INTERVAL
     */
    interval?: number;
    startDate: string;
    endDate: string;
    locationId: string;
    customerId: string;
    petId: string;
    serviceId: string;
};

