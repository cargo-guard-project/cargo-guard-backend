import { AppDataSource } from '../../config/data-source';
import { Shipment } from '../../entities/shipment/shipment.entity';
import { Incident } from '../../entities/incident/incident.entity';
import { TelemetryRecord } from '../../entities/telemetry-record/telemetry-record.entity';
import { ShipmentStatus } from '../../declarations';

const shipmentRepository = AppDataSource.getRepository(Shipment);
const incidentRepository = AppDataSource.getRepository(Incident);
const telemetryRepository = AppDataSource.getRepository(TelemetryRecord);

interface CreateShipmentData {
  status?: ShipmentStatus;
  startDate?: Date;
  endDate?: Date;
  origin: string;
  destination: string;
  notes?: string;
  cargoId: number;
  containerId: number;
  userId: number;
}

interface UpdateShipmentData {
  status?: ShipmentStatus;
  startDate?: Date;
  endDate?: Date;
  origin?: string;
  destination?: string;
  notes?: string;
  cargoId?: number;
  containerId?: number;
}

export const shipmentsService = {
  async findAll(): Promise<Shipment[]> {
    return shipmentRepository.find({
      relations: ['cargo', 'container', 'user'],
      order: { id: 'DESC' },
    });
  },

  async findById(id: number): Promise<Shipment | null> {
    return shipmentRepository.findOne({
      where: { id },
      relations: ['cargo', 'container', 'user'],
    });
  },

  async create(data: CreateShipmentData): Promise<Shipment> {
    const shipment = shipmentRepository.create({
      status: data.status || 'planned',
      startDate: data.startDate,
      endDate: data.endDate,
      origin: data.origin,
      destination: data.destination,
      notes: data.notes,
      cargoId: data.cargoId,
      containerId: data.containerId,
      userId: data.userId,
    });

    return shipmentRepository.save(shipment);
  },

  async update(id: number, data: UpdateShipmentData): Promise<Shipment> {
    const shipment = await shipmentRepository.findOne({ where: { id } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    Object.assign(shipment, data);
    return shipmentRepository.save(shipment);
  },

  async delete(id: number): Promise<void> {
    const shipment = await shipmentRepository.findOne({ where: { id } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    await shipmentRepository.remove(shipment);
  },

  async getIncidents(shipmentId: number): Promise<Incident[]> {
    const shipment = await shipmentRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return incidentRepository.find({
      where: { shipmentId },
      order: { createdAt: 'DESC' },
    });
  },

  async getTelemetry(shipmentId: number, limit: number = 100): Promise<TelemetryRecord[]> {
    const shipment = await shipmentRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return telemetryRepository.find({
      where: { containerId: shipment.containerId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  },
};
