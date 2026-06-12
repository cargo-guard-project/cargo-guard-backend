import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ShipmentStatus } from '../../declarations';
import { Cargo } from '../cargo/cargo.entity';
import { Container } from '../container/container.entity';
import { User } from '../user/user.entity';
import { Incident } from '../incident/incident.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: 'planned' })
  status: ShipmentStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Cargo, (cargo) => cargo.shipments)
  @JoinColumn({ name: 'cargoId' })
  cargo: Cargo;

  @Column()
  cargoId: number;

  @ManyToOne(() => Container, (container) => container.shipments)
  @JoinColumn({ name: 'containerId' })
  container: Container;

  @Column()
  containerId: number;

  @ManyToOne(() => User, (user) => user.shipments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => Incident, (incident) => incident.shipment)
  incidents: Incident[];
}
