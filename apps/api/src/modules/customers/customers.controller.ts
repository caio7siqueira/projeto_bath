import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Customer with this phone already exists' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.tenantId, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'Customers list retrieved successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  findAll(
    @CurrentUser() user: any,
    @Query() query: QueryCustomersDto,
  ) {
    return this.customersService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(id, user);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft delete customer (ADMIN/SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Customer deleted (soft)' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Customer already deleted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async softDelete(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.customersService.softDelete(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Customer with this phone already exists' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto, user);
  }

  // ...existing code...

  @Get(':customerId/contacts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar contatos relacionados ao customer' })
  async findContacts(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
  ) {
    const customer = await this.customersService.findOne(customerId, user);
    return this.customersService.listContacts(customer);
  }

  @Post(':customerId/contacts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Criar contato relacionado ao customer' })
  async createContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Body() dto: CreateContactDto,
  ) {
    const customer = await this.customersService.findOne(customerId, user);
    return this.customersService.createContact(customer, dto);
  }

  @Patch(':customerId/contacts/:contactId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Atualizar contato de customer' })
  async updateContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    const customer = await this.customersService.findOne(customerId, user);
    return this.customersService.updateContact(customer, contactId, dto);
  }

  @Delete(':customerId/contacts/:contactId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Remover contato de customer' })
  async deleteContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Param('contactId') contactId: string,
  ) {
    const customer = await this.customersService.findOne(customerId, user);
    return this.customersService.deleteContact(customer, contactId);
  }
}
