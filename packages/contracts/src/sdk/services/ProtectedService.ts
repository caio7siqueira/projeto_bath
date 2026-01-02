/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProtectedService {
    /**
     * Ping with auth
     * @returns any
     * @throws ApiError
     */
    public static protectedControllerPing(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protected/ping',
        });
    }
    /**
     * Admin-only endpoint
     * @returns any
     * @throws ApiError
     */
    public static protectedControllerAdminOnly(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protected/admin-only',
        });
    }
    /**
     * Enforce same tenant access
     * @returns any
     * @throws ApiError
     */
    public static protectedControllerTenantCheck({
        tenantId,
    }: {
        tenantId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protected/tenant/{tenantId}',
            path: {
                'tenantId': tenantId,
            },
        });
    }
}
