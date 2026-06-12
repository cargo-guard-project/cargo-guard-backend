import { AppDataSource } from '../../config/data-source';
import { Cargo } from '../../entities/cargo/cargo.entity';

const cargoRepository = AppDataSource.getRepository(Cargo);

interface CreateCargoData {
  name: string;
  description?: string;
  type: string;
  temperatureMin: number;
  temperatureMax: number;
  humidityMin: number;
  humidityMax: number;
}

interface UpdateCargoData {
  name?: string;
  description?: string;
  type?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
}

export const cargoService = {
  async findAll(): Promise<Cargo[]> {
    return cargoRepository.find({ order: { id: 'ASC' } });
  },

  async findById(id: number): Promise<Cargo | null> {
    return cargoRepository.findOne({ where: { id } });
  },

  async create(data: CreateCargoData): Promise<Cargo> {
    const cargo = cargoRepository.create(data);
    return cargoRepository.save(cargo);
  },

  async update(id: number, data: UpdateCargoData): Promise<Cargo> {
    const cargo = await cargoRepository.findOne({ where: { id } });
    if (!cargo) {
      throw new Error('Cargo not found');
    }

    Object.assign(cargo, data);
    return cargoRepository.save(cargo);
  },

  async delete(id: number): Promise<void> {
    const cargo = await cargoRepository.findOne({ where: { id } });
    if (!cargo) {
      throw new Error('Cargo not found');
    }

    await cargoRepository.remove(cargo);
  },
};
