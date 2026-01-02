/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateLocationDto } from '../models/CreateLocationDto';
import type { UpdateLocationDto } from '../models/UpdateLocationDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LocationsService {
    /**
     * Criar nova localização (ADMIN/STAFF)
     * @returns any
     * @throws ApiError
     */
    public static locationsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateLocationDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/locations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Listar localizações do tenant
     * @returns any
     * @throws ApiError
     */
    public static locationsControllerFindByTenant({
        page,
        pageSize,
        sort,
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
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/locations',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
            },
        });
    }
    /**
     * Obter localização por ID
     * @returns any
     * @throws ApiError
     */
    public static locationsControllerFindById({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/locations/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Atualizar localização (ADMIN/STAFF)
     * @returns any
     * @throws ApiError
     */
    public static locationsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateLocationDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/locations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
