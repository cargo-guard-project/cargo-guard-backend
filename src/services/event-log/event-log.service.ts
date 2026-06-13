import { FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { EventLog } from '../../entities/event-log/event-log.entity';

const eventLogRepository = AppDataSource.getRepository(EventLog);

export type EntityType = 'user' | 'cargo' | 'container' | 'shipment' | 'incident' | 'backup';
export type ActionType = 'create' | 'update' | 'delete' | 'status_change' | 'resolve' | 'export' | 'import';

export interface LogEventData {
  action: ActionType;
  entityType: EntityType;
  entityId: number;
  userId?: number;
  details?: Record<string, unknown>;
}

export interface EventLogFilters {
  entityType?: EntityType;
  action?: ActionType;
  userId?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const eventLogService = {
  async log(data: LogEventData): Promise<EventLog> {
    const eventLog = eventLogRepository.create({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      details: data.details,
    });
    return eventLogRepository.save(eventLog);
  },

  async findAll(
    filters: EventLogFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResult<EventLog>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<EventLog> = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.fromDate && filters.toDate) {
      where.createdAt = Between(filters.fromDate, filters.toDate);
    } else if (filters.fromDate) {
      where.createdAt = MoreThanOrEqual(filters.fromDate);
    } else if (filters.toDate) {
      where.createdAt = LessThanOrEqual(filters.toDate);
    }

    const [data, total] = await eventLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: number): Promise<EventLog | null> {
    return eventLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  },

  async findByEntity(entityType: EntityType, entityId: number): Promise<EventLog[]> {
    return eventLogRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  },
};
