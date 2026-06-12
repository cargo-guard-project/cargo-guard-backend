import { AppDataSource } from '../../config/data-source';
import { Shipment } from '../../entities/shipment/shipment.entity';
import { Incident } from '../../entities/incident/incident.entity';
import { TelemetryRecord } from '../../entities/telemetry-record/telemetry-record.entity';
import { EventLog } from '../../entities/event-log/event-log.entity';

const shipmentRepository = AppDataSource.getRepository(Shipment);
const incidentRepository = AppDataSource.getRepository(Incident);
const telemetryRepository = AppDataSource.getRepository(TelemetryRecord);
const eventLogRepository = AppDataSource.getRepository(EventLog);

export interface ShipmentReport {
  shipment: Shipment;
  incidents: Incident[];
  telemetry: TelemetryRecord[];
  eventLogs: EventLog[];
  summary: {
    totalIncidents: number;
    resolvedIncidents: number;
    unresolvedIncidents: number;
    incidentsBySeverity: Record<string, number>;
    telemetryRecords: number;
    temperatureRange: { min: number | null; max: number | null };
    humidityRange: { min: number | null; max: number | null };
  };
}

export const reportsService = {
  async getShipmentReport(shipmentId: number): Promise<ShipmentReport | null> {
    const shipment = await shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['cargo', 'container', 'user'],
    });

    if (!shipment) {
      return null;
    }

    const incidents = await incidentRepository.find({
      where: { shipmentId },
      order: { createdAt: 'DESC' },
    });

    const telemetry = await telemetryRepository.find({
      where: { containerId: shipment.containerId },
      order: { timestamp: 'ASC' },
    });

    const eventLogs = await eventLogRepository.find({
      where: { entityType: 'shipment', entityId: shipmentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const resolvedIncidents = incidents.filter(i => i.resolvedAt !== null);
    const unresolvedIncidents = incidents.filter(i => i.resolvedAt === null);

    const incidentsBySeverity: Record<string, number> = {};
    incidents.forEach(i => {
      incidentsBySeverity[i.severity] = (incidentsBySeverity[i.severity] || 0) + 1;
    });

    let tempMin: number | null = null;
    let tempMax: number | null = null;
    let humidityMin: number | null = null;
    let humidityMax: number | null = null;

    telemetry.forEach(t => {
      const temp = Number(t.temperature);
      const humidity = Number(t.humidity);

      if (tempMin === null || temp < tempMin) tempMin = temp;
      if (tempMax === null || temp > tempMax) tempMax = temp;
      if (humidityMin === null || humidity < humidityMin) humidityMin = humidity;
      if (humidityMax === null || humidity > humidityMax) humidityMax = humidity;
    });

    return {
      shipment,
      incidents,
      telemetry,
      eventLogs,
      summary: {
        totalIncidents: incidents.length,
        resolvedIncidents: resolvedIncidents.length,
        unresolvedIncidents: unresolvedIncidents.length,
        incidentsBySeverity,
        telemetryRecords: telemetry.length,
        temperatureRange: { min: tempMin, max: tempMax },
        humidityRange: { min: humidityMin, max: humidityMax },
      },
    };
  },
};
