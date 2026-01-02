/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAppointmentDto = {
    customerId: string;
    locationId: string;
    petId?: string;
    serviceId?: string;
    /**
     * ISO 8601 timestamp
     */
    startsAt: string;
    /**
     * ISO 8601 timestamp
     */
    endsAt: string;
    notes?: string;
};

