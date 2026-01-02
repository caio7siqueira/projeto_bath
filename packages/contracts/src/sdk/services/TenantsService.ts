/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTenantDto } from '../models/CreateTenantDto';
import type { UpdateTenantDto } from '../models/UpdateTenantDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TenantsService {
    /**
     * Criar novo tenant (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static tenantsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateTenantDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tenants',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Listar todos os tenants (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static tenantsControllerFindAll({
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
            url: '/tenants',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
            },
        });
    }
    /**
     * Obter tenant por ID (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static tenantsControllerFindById({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenants/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Atualizar tenant (ADMIN)
     * @returns any
     * @throws ApiError
     */
    public static tenantsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateTenantDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/tenants/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
