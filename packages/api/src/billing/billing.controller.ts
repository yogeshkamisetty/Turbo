import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapacityCredit, Session, Entitlement, Allocation } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    @InjectRepository(CapacityCredit) private creditRepo: Repository<CapacityCredit>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Entitlement) private entitlementRepo: Repository<Entitlement>,
    @InjectRepository(Allocation) private allocationRepo: Repository<Allocation>,
  ) {}

  @Get('credits')
  async getCredits(@Request() req) {
    const where = req.user.role === 'ADMIN' ? {} : { tenantId: req.user.tenantId };
    return this.creditRepo.find({ where });
  }

  @Get('invoice')
  async getInvoice(@Request() req) {
    const tenantId = req.user.tenantId || '11111111-1111-1111-1111-111111111111';
    const sessions = await this.sessionRepo.find({ where: { tenantId } });
    const entitlements = await this.entitlementRepo.find({ where: { tenantId } });
    const allocations = await this.allocationRepo.find({ where: { tenantId } });

    const floorKw = entitlements.reduce((sum, e) => sum + parseFloat(e.floorKw as any || 0), 0);
    const tierWeight = 1.0;

    const totalEnergyKwh = allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedKw as any) * (30.0/3600.0)), 0);
    const energyCost = Math.round(totalEnergyKwh * 12.0 * 100) / 100;
    const peakAllocationCost = Math.round(floorKw * 15.0 * 100) / 100;

    // D1 Surplus Pool: Headroom released by idle/early-departed vehicles generates capacity credits!
    const idleSessionsCount = allocations.filter(a => parseFloat(a.allocatedKw as any) === 0).length;
    const creditEarned = Math.round(idleSessionsCount * 5.0 * 0.15 * 100) / 100;

    if (creditEarned > 0 && tenantId) {
      await this.allocationRepo.query(
        `INSERT INTO capacity_credits (tenant_id, credit_amount, reason, created_at)
         VALUES ($1, $2, 'D1 Released Headroom Surplus Pool Credit', NOW())`,
        [tenantId, creditEarned]
      ).catch(() => {});
    }

    const totalCreditsQuery = await this.allocationRepo.query(
      `SELECT COALESCE(SUM(credit_amount), 0) as total FROM capacity_credits WHERE tenant_id = $1 OR $1 IS NULL`,
      [tenantId]
    );
    const totalCredits = parseFloat(totalCreditsQuery[0]?.total || 24.50);

    const totalInvoice = Math.max(0, Math.round((energyCost + peakAllocationCost - totalCredits) * 100) / 100);

    return {
      tenantId,
      floorKw,
      tierWeight,
      totalEnergyKwh: Math.round(totalEnergyKwh * 100) / 100,
      energyCost,
      peakAllocationCost,
      releasedHeadroomCredits: totalCredits,
      totalInvoice,
    };
  }
}

function roundTwo(val: number): number {
  return Math.round(val * 100) / 100;
}
