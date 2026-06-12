import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateCargoDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  type: string;

  @IsNumber()
  temperatureMin: number;

  @IsNumber()
  temperatureMax: number;

  @IsNumber()
  humidityMin: number;

  @IsNumber()
  humidityMax: number;
}

export class UpdateCargoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @IsOptional()
  @IsNumber()
  temperatureMin?: number;

  @IsOptional()
  @IsNumber()
  temperatureMax?: number;

  @IsOptional()
  @IsNumber()
  humidityMin?: number;

  @IsOptional()
  @IsNumber()
  humidityMax?: number;
}
