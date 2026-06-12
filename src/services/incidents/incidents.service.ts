import { AppDataSource } from '../../config/data-source';
import { Incident } from '../../entities/incident/incident.entity';
import { Shipment } from '../../entities/shipment/shipment.entity';
import { IncidentType, IncidentSeverity } from '../../declarations';
import { notificationService } from '../notification/notification.service';

const incidentRepository = AppDataSource.getRepository(Incident);
const shipmentRepository = AppDataSource.getRepository(Shipment);

export interface CreateIncidentDto {
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  shipmentId: number;
}

export const incidentsService = {
  async create(data: CreateIncidentDto): Promise<Incident> {
    const shipment = await shipmentRepository.findOne({ where: { id: data.shipmentId } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const incident = incidentRepository.create({
      type: data.type,
      severity: data.severity,
      description: data.description,
      shipmentId: data.shipmentId,
    });

    return incidentRepository.save(incident);
  },

  async findAll(): Promise<Incident[]> {
    return incidentRepository.find({
      relations: ['shipment'],
      order: { createdAt: 'DESC' },
    });
  },

  async findById(id: number): Promise<Incident | null> {
    return incidentRepository.findOne({
      where: { id },
      relations: ['shipment'],
    });
  },

  async resolve(id: number): Promise<Incident> {
    const incident = await incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.resolvedAt) {
      throw new Error('Incident already resolved');
    }

    incident.resolvedAt = new Date();
    const savedIncident = await incidentRepository.save(incident);

    await notificationService.notifyIncidentResolved(savedIncident, incident.shipmentId);

    return savedIncident;
  },
};
