/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateServiceDto } from '../models/CreateServiceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServicesService {
    /**
     * Criar um serviço
     * @returns any Serviço criado com sucesso
     * @throws ApiError
     */
    public static servicesControllerCreate({
        requestBody,
    }: {
        requestBody: CreateServiceDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/services',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Nome já existe para este tenant`,
            },
        });
    }
    /**
     * Listar serviços do tenant
     * @returns any Lista de serviços
     * @throws ApiError
     */
    public static servicesControllerFindAll({
        page,
        pageSize,
        sort,
        includeInactive,
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
         * Define se serviços inativos devem ser incluídos
         */
        includeInactive?: boolean,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/services',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
                'includeInactive': includeInactive,
            },
        });
    }
}
