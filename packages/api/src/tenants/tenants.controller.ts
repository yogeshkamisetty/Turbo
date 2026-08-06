import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, Entitlement } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(Entitlement)
    private entitlementRepo: Repository<Entitlement>,
  ) {}

  @Get()
  async getTenants(@Request() req) {
    if (req.user.role === 'ADMIN') {
      const tenants = await this.tenantRepo.find();
      const entitlements = await this.entitlementRepo.find();
      return tenants.map(t => ({
        ...t,
        entitlements: entitlements.filter(e => e.tenantId === t.id),
      }));
    }
    return this.tenantRepo.find({ where: { id: req.user.tenantId } });
  }

  @Get('entitlements')
  async getEntitlements(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.entitlementRepo.find();
    }
    return this.entitlementRepo.find({ where: { tenantId: req.user.tenantId } });
  }
}
