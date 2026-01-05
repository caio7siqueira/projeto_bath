import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários do tenant ou da plataforma (SUPER_ADMIN)' })
  listUsers(@CurrentUser() user: any, @Query() query: ListUsersDto) {
    return this.usersService.listUsers(user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar/invitar novo usuário' })
  createUser(@CurrentUser() user: any, @Body() dto: CreateUserDto) {
    return this.usersService.createUser(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar perfil, status ou senha' })
  updateUser(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário (soft delete)' })
  deleteUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deactivateUser(user, id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Gerar nova senha temporária para o usuário' })
  resetPassword(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.resetPassword(user, id);
  }
}
