import crypto from 'crypto';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Cargo, Container, EventLog, Incident, Shipment, TelemetryRecord, User } from '../../entities';

interface SystemDataExport {
  version: number;
  exportedAt: string;
  data: {
    users: Partial<User>[];
    cargo: Cargo[];
    containers: Container[];
    shipments: Shipment[];
    telemetryRecords: TelemetryRecord[];
    incidents: Incident[];
    eventLogs: EventLog[];
  };
}

type ImportableData = Partial<{
  cargo: Partial<Cargo>[];
  containers: Partial<Container>[];
  shipments: Partial<Shipment>[];
  telemetryRecords: Partial<TelemetryRecord>[];
  incidents: Partial<Incident>[];
}>;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function generateApiKey(): string {
  return `cg_${crypto.randomBytes(32).toString('hex')}`;
}

function pickDefined<T extends Record<string, unknown>>(source: T, keys: string[]): Partial<T> {
  return keys.reduce<Partial<T>>((result, key) => {
    if (source[key] !== undefined) {
      result[key as keyof T] = source[key] as T[keyof T];
    }
    return result;
  }, {});
}

async function saveCargo(manager: EntityManager, records: Partial<Cargo>[]): Promise<number> {
  const repository = manager.getRepository(Cargo);
  const entities = records.map((record) => repository.create(pickDefined(record, [
    'id',
    'name',
    'description',
    'type',
    'temperatureMin',
    'temperatureMax',
    'humidityMin',
    'humidityMax',
    'createdAt',
  ])));

  if (entities.length === 0) return 0;
  await repository.save(entities);
  return entities.length;
}

async function saveContainers(manager: EntityManager, records: Partial<Container>[]): Promise<number> {
  const repository = manager.getRepository(Container);
  const entities = records.map((record) => repository.create({
    ...pickDefined(record, [
      'id',
      'serialNumber',
      'name',
      'apiKey',
      'status',
      'lastTemperature',
      'lastHumidity',
      'lastLocationLat',
      'lastLocationLng',
      'lastUpdatedAt',
    ]),
    apiKey: record.apiKey || generateApiKey(),
  }));

  if (entities.length === 0) return 0;
  await repository.save(entities);
  return entities.length;
}

async function saveShipments(manager: EntityManager, records: Partial<Shipment>[]): Promise<number> {
  const repository = manager.getRepository(Shipment);
  const entities = records.map((record) => repository.create(pickDefined(record, [
    'id',
    'status',
    'startDate',
    'endDate',
    'origin',
    'destination',
    'notes',
    'cargoId',
    'containerId',
    'userId',
  ])));

  if (entities.length === 0) return 0;
  await repository.save(entities);
  return entities.length;
}

async function saveTelemetry(manager: EntityManager, records: Partial<TelemetryRecord>[]): Promise<number> {
  const repository = manager.getRepository(TelemetryRecord);
  const entities = records.map((record) => repository.create(pickDefined(record, [
    'id',
    'temperature',
    'humidity',
    'latitude',
    'longitude',
    'batteryLevel',
    'timestamp',
    'containerId',
  ])));

  if (entities.length === 0) return 0;
  await repository.save(entities);
  return entities.length;
}

async function saveIncidents(manager: EntityManager, records: Partial<Incident>[]): Promise<number> {
  const repository = manager.getRepository(Incident);
  const entities = records.map((record) => repository.create(pickDefined(record, [
    'id',
    'type',
    'severity',
    'description',
    'resolvedAt',
    'createdAt',
    'shipmentId',
  ])));

  if (entities.length === 0) return 0;
  await repository.save(entities);
  return entities.length;
}

export const adminDataService = {
  async exportData(): Promise<SystemDataExport> {
    const userRepository = AppDataSource.getRepository(User);
    const cargoRepository = AppDataSource.getRepository(Cargo);
    const containerRepository = AppDataSource.getRepository(Container);
    const shipmentRepository = AppDataSource.getRepository(Shipment);
    const telemetryRepository = AppDataSource.getRepository(TelemetryRecord);
    const incidentRepository = AppDataSource.getRepository(Incident);
    const eventLogRepository = AppDataSource.getRepository(EventLog);

    const [users, cargo, containers, shipments, telemetryRecords, incidents, eventLogs] = await Promise.all([
      userRepository.find({
        select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
        order: { id: 'ASC' },
      }),
      cargoRepository.find({ order: { id: 'ASC' } }),
      containerRepository.find({ order: { id: 'ASC' } }),
      shipmentRepository.find({ order: { id: 'ASC' } }),
      telemetryRepository.find({ order: { id: 'ASC' } }),
      incidentRepository.find({ order: { id: 'ASC' } }),
      eventLogRepository.find({ order: { id: 'ASC' } }),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        users,
        cargo,
        containers,
        shipments,
        telemetryRecords,
        incidents,
        eventLogs,
      },
    };
  },

  async importData(payload: unknown): Promise<{ imported: Record<string, number>; skipped: string[] }> {
    const root = payload as { data?: ImportableData } & ImportableData;
    const data = root.data || root;

    const result = await AppDataSource.transaction(async (manager) => {
      const imported = {
        cargo: await saveCargo(manager, asArray<Partial<Cargo>>(data.cargo)),
        containers: await saveContainers(manager, asArray<Partial<Container>>(data.containers)),
        shipments: await saveShipments(manager, asArray<Partial<Shipment>>(data.shipments)),
        telemetryRecords: await saveTelemetry(manager, asArray<Partial<TelemetryRecord>>(data.telemetryRecords)),
        incidents: await saveIncidents(manager, asArray<Partial<Incident>>(data.incidents)),
      };

      return imported;
    });

    return {
      imported: result,
      skipped: ['users', 'eventLogs'],
    };
  },
};
