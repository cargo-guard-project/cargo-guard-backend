import { IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class TelemetryDto {
  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;

  @IsOptional()
  @IsNumber()
  batteryLevel?: number;
}

export class DoorEventDto {
  @IsBoolean()
  doorOpen: boolean;
}
