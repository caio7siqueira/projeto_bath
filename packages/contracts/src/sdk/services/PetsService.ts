/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePetDto } from '../models/CreatePetDto';
import type { UpdatePetDto } from '../models/UpdatePetDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PetsService {
    /**
     * Listar todos os pets do tenant (paginado)
     * @returns any Lista paginada de pets
     * @throws ApiError
     */
    public static petsControllerListAll({
        page,
        pageSize,
        sort,
        q,
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
         * Filtro por nome do pet
         */
        q?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pets',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
                'q': q,
            },
        });
    }
    /**
     * Listar pets de um customer
     * @returns any Lista de pets
     * @throws ApiError
     */
    public static petsControllerList({
        customerId,
        page,
        pageSize,
        sort,
    }: {
        customerId: string,
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
            url: '/customers/{customerId}/pets',
            path: {
                'customerId': customerId,
            },
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
            },
        });
    }
    /**
     * Criar pet para um customer
     * @returns any Pet criado
     * @throws ApiError
     */
    public static petsControllerCreate({
        customerId,
        requestBody,
    }: {
        customerId: string,
        requestBody: CreatePetDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customers/{customerId}/pets',
            path: {
                'customerId': customerId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Atualizar pet (nome, lifeStatus, allowNotifications)
     * @returns any Pet atualizado
     * @throws ApiError
     */
    public static petsControllerUpdate({
        petId,
        requestBody,
    }: {
        petId: string,
        requestBody: UpdatePetDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pets/{petId}',
            path: {
                'petId': petId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Marcar pet como falecido
     * @returns any Pet marcado como falecido
     * @throws ApiError
     */
    public static petsControllerMarkDeceased({
        petId,
    }: {
        petId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pets/{petId}/mark-deceased',
            path: {
                'petId': petId,
            },
            errors: {
                404: `Pet não encontrado`,
                422: `Pet já está falecido`,
            },
        });
    }
}
