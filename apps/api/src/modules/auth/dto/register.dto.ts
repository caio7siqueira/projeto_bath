import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'efizion-bath-demo' })
  @ValidateIf((dto) => dto.role !== UserRole.SUPER_ADMIN)
  @IsString()
  tenantSlug?: string;
}
