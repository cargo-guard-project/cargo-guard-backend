import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IncidentType, IncidentSeverity } from '../../declarations';
import { Shipment } from '../shipment/shipment.entity';

@Entity('incidents')
@Index(['shipmentId', 'createdAt'])
@Index(['severity'])
@Index(['resolvedAt'])
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  type: IncidentType;

  @Column({ type: 'varchar' })
  severity: IncidentSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.incidents)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column()
  shipmentId: number;
}
