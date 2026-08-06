import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Charger, Connector } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chargers')
@UseGuards(JwtAuthGuard)
export class ChargersController {
  constructor(
    @InjectRepository(Charger) private chargerRepo: Repository<Charger>,
    @InjectRepository(Connector) private connectorRepo: Repository<Connector>,
  ) {}

  @Get()
  async getChargers() {
    const chargers = await this.chargerRepo.find();
    const connectors = await this.connectorRepo.find();
    return chargers.map(c => ({
      ...c,
      connectors: connectors.filter(conn => conn.chargerId === c.id),
    }));
  }
}
