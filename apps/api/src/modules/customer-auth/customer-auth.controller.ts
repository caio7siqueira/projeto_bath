import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { CustomerAuthService } from './customer-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Customer Auth')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly service: CustomerAuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP code via SMS' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiTooManyRequestsResponse({ description: 'Limite de solicitações de OTP excedido' })
  @Throttle({ requestOtp: { limit: 3, ttl: 300 } })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.service.requestOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and issue JWT' })
  @ApiResponse({ status: 200, description: 'JWT issued' })
  @ApiTooManyRequestsResponse({ description: 'Tentativas de verificação excedidas' })
  @Throttle({ verifyOtp: { limit: 5, ttl: 300 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto);
  }
}
