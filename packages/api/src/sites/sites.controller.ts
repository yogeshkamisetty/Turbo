import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site, Circuit } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(
    @InjectRepository(Site) private siteRepo: Repository<Site>,
    @InjectRepository(Circuit) private circuitRepo: Repository<Circuit>,
  ) {}

  @Get()
  async getSites() {
    const sites = await this.siteRepo.find();
    const circuits = await this.circuitRepo.find();
    return sites.map(s => ({
      ...s,
      circuits: circuits.filter(c => c.siteId === s.id),
    }));
  }
}
