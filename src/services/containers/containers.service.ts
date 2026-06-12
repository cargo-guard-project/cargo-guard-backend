import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { Container } from '../../entities/container/container.entity';
import { TelemetryRecord } from '../../entities/telemetry-record/telemetry-record.entity';
import { ContainerStatus } from '../../declarations';

const containerRepository = AppDataSource.getRepository(Container);
const telemetryRepository = AppDataSource.getRepository(TelemetryRecord);

function generateApiKey(): string {
  return `cg_${crypto.randomBytes(32).toString('hex')}`;
}

interface CreateContainerData {
  serialNumber: string;
  name: string;
  status?: ContainerStatus;
}

interface UpdateContainerData {
  serialNumber?: string;
  name?: string;
  status?: ContainerStatus;
}

export const containersService = {
  async findAll(): Promise<Container[]> {
    return containerRepository.find({ order: { id: 'ASC' } });
  },

  async findById(id: number): Promise<Container | null> {
    return containerRepository.findOne({ where: { id } });
  },

  async create(data: CreateContainerData): Promise<Container> {
    const existing = await containerRepository.findOne({ where: { serialNumber: data.serialNumber } });
    if (existing) {
      throw new Error('Container with this serial number already exists');
    }

    const container = containerRepository.create({
      serialNumber: data.serialNumber,
      name: data.name,
      status: data.status || 'available',
      apiKey: generateApiKey(),
    });

    return containerRepository.save(container);
  },

  async regenerateApiKey(id: number): Promise<Container> {
    const container = await containerRepository.findOne({ where: { id } });
    if (!container) {
      throw new Error('Container not found');
    }

    container.apiKey = generateApiKey();
    return containerRepository.save(container);
  },

  async findByApiKey(apiKey: string): Promise<Container | null> {
    return containerRepository.findOne({ where: { apiKey } });
  },

  async update(id: number, data: UpdateContainerData): Promise<Container> {
    const container = await containerRepository.findOne({ where: { id } });
    if (!container) {
      throw new Error('Container not found');
    }

    if (data.serialNumber && data.serialNumber !== container.serialNumber) {
      const existing = await containerRepository.findOne({ where: { serialNumber: data.serialNumber } });
      if (existing) {
        throw new Error('Serial number already in use');
      }
    }

    Object.assign(container, data);
    return containerRepository.save(container);
  },

  async delete(id: number): Promise<void> {
    const container = await containerRepository.findOne({ where: { id } });
    if (!container) {
      throw new Error('Container not found');
    }

    await containerRepository.remove(container);
  },

  async getTelemetry(containerId: number, limit: number = 100): Promise<TelemetryRecord[]> {
    const container = await containerRepository.findOne({ where: { id: containerId } });
    if (!container) {
      throw new Error('Container not found');
    }

    return telemetryRepository.find({
      where: { containerId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  },
};
