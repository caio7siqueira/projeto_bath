/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateContactDto } from '../models/CreateContactDto';
import type { CreateCustomerDto } from '../models/CreateCustomerDto';
import type { UpdateContactDto } from '../models/UpdateContactDto';
import type { UpdateCustomerDto } from '../models/UpdateCustomerDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CustomersService {
    /**
     * Create a new customer
     * @returns any Customer created successfully
     * @throws ApiError
     */
    public static customersControllerCreate({
        requestBody,
    }: {
        requestBody: CreateCustomerDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Customer with this phone already exists`,
            },
        });
    }
    /**
     * List all customers
     * @returns any Customers list retrieved successfully
     * @throws ApiError
     */
    public static customersControllerFindAll({
        page,
        pageSize,
        sort,
        q,
        email,
        phone,
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
         * Search in name, email or phone
         */
        q?: string,
        /**
         * Filter by exact email
         */
        email?: string,
        /**
         * Filter by exact phone
         */
        phone?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sort': sort,
                'q': q,
                'email': email,
                'phone': phone,
            },
        });
    }
    /**
     * Get a customer by ID
     * @returns any Customer retrieved successfully
     * @throws ApiError
     */
    public static customersControllerFindOne({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Customer not found`,
            },
        });
    }
    /**
     * Soft delete customer (ADMIN/SUPERADMIN)
     * @returns any Customer deleted (soft)
     * @throws ApiError
     */
    public static customersControllerSoftDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/customers/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Customer not found`,
                409: `Customer already deleted`,
            },
        });
    }
    /**
     * Update a customer
     * @returns any Customer updated successfully
     * @throws ApiError
     */
    public static customersControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateCustomerDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/customers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Customer not found`,
                409: `Customer with this phone already exists`,
            },
        });
    }
    /**
     * Listar contatos relacionados ao customer
     * @returns any
     * @throws ApiError
     */
    public static customersControllerFindContacts({
        customerId,
    }: {
        customerId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers/{customerId}/contacts',
            path: {
                'customerId': customerId,
            },
        });
    }
    /**
     * Criar contato relacionado ao customer
     * @returns any
     * @throws ApiError
     */
    public static customersControllerCreateContact({
        customerId,
        requestBody,
    }: {
        customerId: string,
        requestBody: CreateContactDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customers/{customerId}/contacts',
            path: {
                'customerId': customerId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Atualizar contato de customer
     * @returns any
     * @throws ApiError
     */
    public static customersControllerUpdateContact({
        customerId,
        contactId,
        requestBody,
    }: {
        customerId: string,
        contactId: string,
        requestBody: UpdateContactDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/customers/{customerId}/contacts/{contactId}',
            path: {
                'customerId': customerId,
                'contactId': contactId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remover contato de customer
     * @returns any
     * @throws ApiError
     */
    public static customersControllerDeleteContact({
        customerId,
        contactId,
    }: {
        customerId: string,
        contactId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/customers/{customerId}/contacts/{contactId}',
            path: {
                'customerId': customerId,
                'contactId': contactId,
            },
        });
    }
}
