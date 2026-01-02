/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * Resumo de agendamentos por status no período
     * @returns any Contagens agregadas
     * @throws ApiError
     */
    public static reportsControllerGetAppointmentsSummary({
        from,
        to,
    }: {
        /**
         * Data inicial ISO 8601 (inclusive)
         */
        from?: string,
        /**
         * Data final ISO 8601 (inclusive)
         */
        to?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/appointments/summary',
            query: {
                'from': from,
                'to': to,
            },
        });
    }
    /**
     * Série temporal de agendamentos (day|month)
     * @returns any Lista de buckets por período
     * @throws ApiError
     */
    public static reportsControllerGetAppointmentsTimeseries({
        from,
        to,
        granularity = 'day',
    }: {
        /**
         * Data inicial ISO 8601 (inclusive)
         */
        from?: string,
        /**
         * Data final ISO 8601 (inclusive)
         */
        to?: string,
        granularity?: 'day' | 'month',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/appointments/timeseries',
            query: {
                'from': from,
                'to': to,
                'granularity': granularity,
            },
        });
    }
}
