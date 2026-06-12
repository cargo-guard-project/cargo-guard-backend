import { IsString, IsNumber, IsIn, MinLength } from 'class-validator';

export class CreateIncidentDto {
  @IsIn(['temperature_violation', 'humidity_violation', 'container_opened'])
  type: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  severity: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  shipmentId: number;
}
