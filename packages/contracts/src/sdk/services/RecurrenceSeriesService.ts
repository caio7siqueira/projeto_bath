/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRecurrenceSeriesDto } from '../models/CreateRecurrenceSeriesDto';
import type { UpdateRecurrenceSeriesDto } from '../models/UpdateRecurrenceSeriesDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RecurrenceSeriesService {
    /**
     * Criar série de recorrência
     * @returns any Recorrência criada e instâncias geradas
     * @throws ApiError
     */
    public static recurrenceSeriesControllerCreate({
        requestBody,
    }: {
        requestBody: CreateRecurrenceSeriesDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/recurrence-series',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Editar série de recorrência
     * @returns any Recorrência atualizada
     * @throws ApiError
     */
    public static recurrenceSeriesControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateRecurrenceSeriesDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/recurrence-series/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
