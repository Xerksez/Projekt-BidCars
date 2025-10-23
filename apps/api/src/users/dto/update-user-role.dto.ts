import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['USER', 'ADMIN'] })
  @IsEnum(Role)
  role!: Role;
}
