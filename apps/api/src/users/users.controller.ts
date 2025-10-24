// apps/api/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiKeyGuard } from 'src/auth/api-key.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'Admin API key',
  })
  async setRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.updateRole(id, dto.role);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }
}
