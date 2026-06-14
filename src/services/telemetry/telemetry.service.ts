import { AppDataSource } from '../../config/data-source';
import { TelemetryRecord } from '../../entities/telemetry-record/telemetry-record.entity';
import { Container } from '../../entities/container/container.entity';
import { Shipment } from '../../entities/shipment/shipment.entity';
import { Incident } from '../../entities/incident/incident.entity';
import { IncidentType, IncidentSeverity } from '../../declarations';
import { notificationService } from '../notification/notification.service';

const telemetryRepository = AppDataSource.getRepository(TelemetryRecord);
const containerRepository = AppDataSource.getRepository(Container);
const shipmentRepository = AppDataSource.getRepository(Shipment);
const incidentRepository = AppDataSource.getRepository(Incident);

export interface TelemetryData {
  serialNumber: string;
  temperature: number;
  humidity: number;
}

export interface TelemetryDataForContainer {
  container: Container;
  temperature: number;
  humidity: number;
}

export interface DoorEventData {
  serialNumber: string;
  doorOpen: boolean;
}

export interface DoorEventDataForContainer {
  container: Container;
  doorOpen: boolean;
}

interface ViolationCheck {
  hasViolation: boolean;
  type?: IncidentType;
  severity?: IncidentSeverity;
  description?: string;
}

function determineSeverity(value: number, min: number, max: number): IncidentSeverity {
  const range = max - min;
  const deviation = value < min ? min - value : value - max;
  const percentage = (deviation / range) * 100;

  if (percentage > 50) return 'critical';
  if (percentage > 25) return 'high';
  if (percentage > 10) return 'medium';
  return 'low';
}

export const telemetryService = {
  async processTelemetry(data: TelemetryData): Promise<{ saved: boolean; telemetry: TelemetryRecord; incidents: Incident[] }> {
    const container = await containerRepository.findOne({
      where: { serialNumber: data.serialNumber },
    });

    if (!container) {
      throw new Error(`Container with serial number ${data.serialNumber} not found`);
    }

    const telemetry = telemetryRepository.create({
      containerId: container.id,
      temperature: data.temperature,
      humidity: data.humidity,
    });
    await telemetryRepository.save(telemetry);

    container.lastTemperature = data.temperature;
    container.lastHumidity = data.humidity;
    await containerRepository.save(container);

    const incidents: Incident[] = [];

    const activeShipment = await shipmentRepository.findOne({
      where: {
        containerId: container.id,
        status: 'in_progress',
      },
      relations: ['cargo'],
    });

    if (activeShipment && activeShipment.cargo) {
      const cargo = activeShipment.cargo;

      const tempCheck = this.checkTemperatureViolation(
        data.temperature,
        Number(cargo.temperatureMin),
        Number(cargo.temperatureMax)
      );

      if (tempCheck.hasViolation) {
        const incident = await this.createIncident(
          activeShipment.id,
          tempCheck.type!,
          tempCheck.severity!,
          tempCheck.description!
        );
        incidents.push(incident);
      }

      const humidityCheck = this.checkHumidityViolation(
        data.humidity,
        Number(cargo.humidityMin),
        Number(cargo.humidityMax)
      );

      if (humidityCheck.hasViolation) {
        const incident = await this.createIncident(
          activeShipment.id,
          humidityCheck.type!,
          humidityCheck.severity!,
          humidityCheck.description!
        );
        incidents.push(incident);
      }
    }

    return { saved: true, telemetry, incidents };
  },

  async processDoorEvent(data: DoorEventData): Promise<{ processed: boolean; incident?: Incident }> {
    const container = await containerRepository.findOne({
      where: { serialNumber: data.serialNumber },
    });

    if (!container) {
      throw new Error(`Container with serial number ${data.serialNumber} not found`);
    }

    if (!data.doorOpen) {
      return { processed: true };
    }

    const activeShipment = await shipmentRepository.findOne({
      where: {
        containerId: container.id,
        status: 'in_progress',
      },
    });

    if (activeShipment) {
      const incident = await this.createIncident(
        activeShipment.id,
        'container_opened',
        'high',
        `Container ${data.serialNumber} was opened during transit`
      );
      return { processed: true, incident };
    }

    return { processed: true };
  },

  async processTelemetryForContainer(data: TelemetryDataForContainer): Promise<{ saved: boolean; telemetry: TelemetryRecord; incidents: Incident[] }> {
    const { container, temperature, humidity } = data;

    const telemetry = telemetryRepository.create({
      containerId: container.id,
      temperature,
      humidity,
    });
    await telemetryRepository.save(telemetry);

    container.lastTemperature = temperature;
    container.lastHumidity = humidity;
    await containerRepository.save(container);

    const incidents: Incident[] = [];

    const activeShipment = await shipmentRepository.findOne({
      where: {
        containerId: container.id,
        status: 'in_progress',
      },
      relations: ['cargo'],
    });

    if (activeShipment && activeShipment.cargo) {
      const cargo = activeShipment.cargo;

      const tempCheck = this.checkTemperatureViolation(
        temperature,
        Number(cargo.temperatureMin),
        Number(cargo.temperatureMax)
      );

      if (tempCheck.hasViolation) {
        const incident = await this.createIncident(
          activeShipment.id,
          tempCheck.type!,
          tempCheck.severity!,
          tempCheck.description!
        );
        incidents.push(incident);
      }

      const humidityCheck = this.checkHumidityViolation(
        humidity,
        Number(cargo.humidityMin),
        Number(cargo.humidityMax)
      );

      if (humidityCheck.hasViolation) {
        const incident = await this.createIncident(
          activeShipment.id,
          humidityCheck.type!,
          humidityCheck.severity!,
          humidityCheck.description!
        );
        incidents.push(incident);
      }
    }

    return { saved: true, telemetry, incidents };
  },

  async processDoorEventForContainer(data: DoorEventDataForContainer): Promise<{ processed: boolean; incident?: Incident }> {
    const { container, doorOpen } = data;

    if (!doorOpen) {
      return { processed: true };
    }

    const activeShipment = await shipmentRepository.findOne({
      where: {
        containerId: container.id,
        status: 'in_progress',
      },
    });

    if (activeShipment) {
      const incident = await this.createIncident(
        activeShipment.id,
        'container_opened',
        'high',
        `Container ${container.serialNumber} was opened during transit`
      );
      return { processed: true, incident };
    }

    return { processed: true };
  },

  checkTemperatureViolation(temp: number, min: number, max: number): ViolationCheck {
    if (temp < min) {
      return {
        hasViolation: true,
        type: 'temperature_violation',
        severity: determineSeverity(temp, min, max),
        description: `Temperature too low: ${temp}°C (min: ${min}°C)`,
      };
    }
    if (temp > max) {
      return {
        hasViolation: true,
        type: 'temperature_violation',
        severity: determineSeverity(temp, min, max),
        description: `Temperature too high: ${temp}°C (max: ${max}°C)`,
      };
    }
    return { hasViolation: false };
  },

  checkHumidityViolation(humidity: number, min: number, max: number): ViolationCheck {
    if (humidity < min) {
      return {
        hasViolation: true,
        type: 'humidity_violation',
        severity: determineSeverity(humidity, min, max),
        description: `Humidity too low: ${humidity}% (min: ${min}%)`,
      };
    }
    if (humidity > max) {
      return {
        hasViolation: true,
        type: 'humidity_violation',
        severity: determineSeverity(humidity, min, max),
        description: `Humidity too high: ${humidity}% (max: ${max}%)`,
      };
    }
    return { hasViolation: false };
  },

  async createIncident(
    shipmentId: number,
    type: IncidentType,
    severity: IncidentSeverity,
    description: string
  ): Promise<Incident> {
    const incident = incidentRepository.create({
      shipmentId,
      type,
      severity,
      description,
    });
    const savedIncident = await incidentRepository.save(incident);

    await notificationService.notifyIncidentCreated(savedIncident, shipmentId);

    return savedIncident;
  },
};
