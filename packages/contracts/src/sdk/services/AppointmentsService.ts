/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAppointmentDto } from '../models/CreateAppointmentDto';
import type { UpdateAppointmentDto } from '../models/UpdateAppointmentDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AppointmentsService {
    /**
     * Criar novo agendamento
     * @returns any Agendamento criado com sucesso
     * @throws ApiError
     */
    public static appointmentsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateAppointmentDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/appointments',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Dados inválidos (startsAt >= endsAt ou duração < 5min)`,
                404: `Cliente ou localização não encontrados`,
                409: `Conflito: overlap com outro agendamento`,
            },
        });
    }
    /**
     * Listar agendamentos com filtros opcionais
     * @returns any Lista de agendamentos (array ou paginated response)
     * @throws ApiError
     */
    public static appointmentsControllerFindAll({
        page,
        pageSize,
        sort,
        locationId,
        customerId,
        from,
        to,
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
        locationId?: string,
        customerId?: string,
        /**
         * Filter from date (ISO 8601)
         */
        from?: string,
        /**
         * Filter to date (ISO 8601)
         */
        to?: string,
        status?: 'SCHEDULED' | 'CANCELLED' | 'DONE',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/appointments',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
                'locationId': locationId,
                'customerId': customerId,
                'from': from,
                'to': to,
                'status': status,
            },
        });
    }
    /**
     * Buscar agendamento por ID
     * @returns any Agendamento encontrado
     * @throws ApiError
     */
    public static appointmentsControllerFindOne({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/appointments/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Agendamento não encontrado`,
            },
        });
    }
    /**
     * Atualizar agendamento
     * @returns any Agendamento atualizado com sucesso
     * @throws ApiError
     */
    public static appointmentsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateAppointmentDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/appointments/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Dados inválidos`,
                404: `Agendamento não encontrado`,
                409: `Conflito: overlap com outro agendamento`,
            },
        });
    }
    /**
     * Cancelar agendamento (idempotente)
     * @returns any Agendamento cancelado com sucesso
     * @throws ApiError
     */
    public static appointmentsControllerCancel({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/appointments/{id}/cancel',
            path: {
                'id': id,
            },
            errors: {
                404: `Agendamento não encontrado`,
            },
        });
    }
    /**
     * Marcar agendamento como DONE (idempotente)
     * @returns any Agendamento marcado como DONE
     * @throws ApiError
     */
    public static appointmentsControllerMarkDone({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/appointments/{id}/mark-done',
            path: {
                'id': id,
            },
            errors: {
                400: `Não é possível marcar cancelado como DONE`,
                404: `Agendamento não encontrado`,
            },
        });
    }
}
