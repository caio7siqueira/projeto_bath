/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateAppointmentDto = {
    /**
     * ISO 8601 timestamp
     */
    startsAt?: string;
    /**
     * ISO 8601 timestamp
     */
    endsAt?: string;
    notes?: string;
    status?: 'SCHEDULED' | 'CANCELLED' | 'DONE';
};

