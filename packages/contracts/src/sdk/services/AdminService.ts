/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Obter configurações do tenant
     * @returns any
     * @throws ApiError
     */
    public static tenantConfigControllerGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/tenant-config',
        });
    }
    /**
     * Atualizar configurações do tenant
     * @returns any
     * @throws ApiError
     */
    public static tenantConfigControllerUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/tenant-config',
        });
    }
}
