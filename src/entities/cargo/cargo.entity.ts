import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Shipment } from '../shipment/shipment.entity';

@Entity('cargos')
export class Cargo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperatureMin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperatureMax: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  humidityMin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  humidityMax: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.cargo)
  shipments: Shipment[];
}
