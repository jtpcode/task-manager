import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MatterStatus } from '@prisma/client';

export class CreateMatterDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  clientName!: string;

  @IsOptional()
  @IsEnum(MatterStatus)
  status?: MatterStatus;
}
