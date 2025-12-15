import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: 'efizion-bath-demo' })
  @IsString()
  tenantSlug!: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  phone!: string;
}
