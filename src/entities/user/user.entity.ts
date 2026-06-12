import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../declarations';
import { Shipment } from '../shipment/shipment.entity';
import { EventLog } from '../event-log/event-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'observer' })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.user)
  shipments: Shipment[];

  @OneToMany(() => EventLog, (eventLog) => eventLog.user)
  eventLogs: EventLog[];
}
