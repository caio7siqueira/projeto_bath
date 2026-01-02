/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IntegrationsService {
    /**
     * Reprocessar evento Omie com erro (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static omieControllerReprocessEvent({
        eventId,
    }: {
        eventId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/omie/reprocess/{eventId}',
            path: {
                'eventId': eventId,
            },
        });
    }
    /**
     * Processar evento Omie (chamado pelo worker)
     * @returns any
     * @throws ApiError
     */
    public static omieControllerProcessEvent({
        eventId,
    }: {
        eventId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/omie/internal/process/{eventId}',
            path: {
                'eventId': eventId,
            },
        });
    }
}
