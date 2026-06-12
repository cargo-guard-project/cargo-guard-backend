import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ContainerStatus } from '../../declarations';
import { Shipment } from '../shipment/shipment.entity';
import { TelemetryRecord } from '../telemetry-record/telemetry-record.entity';

@Entity('containers')
export class Container {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  serialNumber: string;

  @Column()
  name: string;

  @Column({ unique: true })
  apiKey: string;

  @Column({ type: 'varchar', default: 'available' })
  status: ContainerStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lastTemperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lastHumidity: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lastLocationLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lastLocationLng: number;

  @UpdateDateColumn()
  lastUpdatedAt: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.container)
  shipments: Shipment[];

  @OneToMany(() => TelemetryRecord, (telemetry) => telemetry.container)
  telemetryRecords: TelemetryRecord[];
}
