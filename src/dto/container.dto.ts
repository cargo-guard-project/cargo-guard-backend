import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';

export class CreateContainerDto {
  @IsString()
  @MinLength(1)
  serialNumber: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsIn(['available', 'in_use', 'maintenance', 'retired'])
  status?: string;
}

export class UpdateContainerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsIn(['available', 'in_use', 'maintenance', 'retired'])
  status?: string;
}
