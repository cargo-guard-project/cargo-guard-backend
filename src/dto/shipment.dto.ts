import { IsString, IsNumber, IsOptional, MinLength, IsIn, IsDateString } from 'class-validator';

export class CreateShipmentDto {
  @IsOptional()
  @IsIn(['planned', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @MinLength(1)
  origin: string;

  @IsString()
  @MinLength(1)
  destination: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  cargoId: number;

  @IsNumber()
  containerId: number;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsIn(['planned', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  origin?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  destination?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  cargoId?: number;

  @IsOptional()
  @IsNumber()
  containerId?: number;
}
