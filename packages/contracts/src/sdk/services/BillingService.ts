/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpsertBillingSubscriptionDto } from '../models/UpsertBillingSubscriptionDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BillingService {
    /**
     * Obter assinatura atual do tenant
     * @returns any
     * @throws ApiError
     */
    public static billingControllerGetCurrent(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/billing/subscription',
        });
    }
    /**
     * Criar nova versão da assinatura do tenant
     * @returns any
     * @throws ApiError
     */
    public static billingControllerUpsert({
        requestBody,
    }: {
        requestBody: UpsertBillingSubscriptionDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/billing/subscription',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
