/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Get dashboard summary with totals
     * @returns any Dashboard stats
     * @throws ApiError
     */
    public static dashboardControllerGetReports(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/dashboard/reports',
        });
    }
}
