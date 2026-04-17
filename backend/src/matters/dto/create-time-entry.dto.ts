import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTimeEntryDto {
  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  minutes!: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
