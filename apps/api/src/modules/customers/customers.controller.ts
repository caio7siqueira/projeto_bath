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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Customer with this phone already exists' })
  create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.tenantId, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'Customers list retrieved successfully' })
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
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Customer with this phone already exists' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer (soft delete)' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(user.tenantId, id);
  }

  @Get(':customerId/contacts')
  @ApiOperation({ summary: 'Listar contatos relacionados ao customer' })
  findContacts(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.listContacts(user.tenantId, customerId);
  }

  @Post(':customerId/contacts')
  @ApiOperation({ summary: 'Criar contato relacionado ao customer' })
  createContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.customersService.createContact(user.tenantId, customerId, dto);
  }

  @Patch(':customerId/contacts/:contactId')
  @ApiOperation({ summary: 'Atualizar contato de customer' })
  updateContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.customersService.updateContact(user.tenantId, customerId, contactId, dto);
  }

  @Delete(':customerId/contacts/:contactId')
  @ApiOperation({ summary: 'Remover contato de customer' })
  deleteContact(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.customersService.deleteContact(user.tenantId, customerId, contactId);
  }
}
