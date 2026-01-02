/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RequestOtpDto } from '../models/RequestOtpDto';
import type { VerifyOtpDto } from '../models/VerifyOtpDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CustomerAuthService {
    /**
     * Request OTP code via SMS
     * @returns any OTP sent
     * @throws ApiError
     */
    public static customerAuthControllerRequestOtp({
        requestBody,
    }: {
        requestBody: RequestOtpDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customer-auth/request-otp',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP and issue JWT
     * @returns any JWT issued
     * @throws ApiError
     */
    public static customerAuthControllerVerifyOtp({
        requestBody,
    }: {
        requestBody: VerifyOtpDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customer-auth/verify-otp',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
