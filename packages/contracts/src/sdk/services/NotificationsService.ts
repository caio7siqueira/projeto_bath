/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * Atualiza status de NotificationJob (chamado pelo worker)
     * @returns any
     * @throws ApiError
     */
    public static notificationsControllerMark({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/notifications/internal/mark/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Listar NotificationJobs do tenant (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static notificationsControllerListJobs({
        page,
        pageSize,
        sort,
        status,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        pageSize?: number,
        /**
         * Sort field and direction, e.g., "createdAt:desc"
         */
        sort?: string,
        /**
         * Filtra jobs por status
         */
        status?: 'SCHEDULED' | 'SENT' | 'ERROR' | 'CANCELLED',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/notifications/admin/jobs',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
                'status': status,
            },
        });
    }
}
