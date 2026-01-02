import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListPetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por nome do pet' })
  @IsOptional()
  @IsString()
  q?: string;
}
