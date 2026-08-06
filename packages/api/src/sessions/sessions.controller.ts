import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, Allocation, ChargePromise, Vehicle, Charger } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Allocation) private allocationRepo: Repository<Allocation>,
    @InjectRepository(ChargePromise) private promiseRepo: Repository<ChargePromise>,
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Charger) private chargerRepo: Repository<Charger>,
  ) {}

  @Get()
  async getSessions(@Request() req) {
    const where = req.user.role === 'ADMIN' ? {} : { tenantId: req.user.tenantId };
    const sessions = await this.sessionRepo.find({ where, order: { startTime: 'DESC' } });
    const vehicles = await this.vehicleRepo.find();
    const chargers = await this.chargerRepo.find();
    const promises = await this.promiseRepo.find();

    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
    const chargerMap = new Map(chargers.map(c => [c.id, c]));

    return sessions.map(s => ({
      ...s,
      vehicle: s.vehicleId ? vehicleMap.get(s.vehicleId) : null,
      charger: chargerMap.get(s.chargerId),
      promise: promises.find(p => p.sessionId === s.id && p.state === 'ACTIVE'),
    }));
  }

  @Get(':id/receipt')
  async getSessionReceipt(@Param('id') id: string) {
    const latestAllocation = await this.allocationRepo.findOne({
      where: { sessionId: id },
      order: { ts: 'DESC' },
    });
    return latestAllocation || { reasonText: 'Standard charging allocation' };
  }

  @Post('copilot/analyze')
  async analyzeFleetDelays(
    @Request() req,
    @Body() body: { query: string; periodHours?: number }
  ) {
    const tenantId = req.user.role === 'ADMIN' ? null : req.user.tenantId;
    const where = tenantId ? { tenantId } : {};

    const latestAllocations = await this.allocationRepo.find({
      where,
      order: { ts: 'DESC' },
      take: 20,
    });

    const bindingCounts: Record<string, number> = {};
    let totalThrottledKw = 0;

    for (const alloc of latestAllocations) {
      const constr = alloc.bindingConstraint || 'Site Capacity';
      bindingCounts[constr] = (bindingCounts[constr] || 0) + 1;
      if (alloc.allocatedKw < 22) {
        totalThrottledKw += (22 - alloc.allocatedKw);
      }
    }

    const primaryBottleneck = Object.keys(bindingCounts).reduce((a, b) =>
      bindingCounts[a] > bindingCounts[b] ? a : b, 'Site Capacity'
    );

    return {
      query: body.query || 'Why was my fleet throttled last night?',
      summaryText: `Analysis of recent allocations indicates primary throttling was caused by '${primaryBottleneck}'. A total of ${Math.round(totalThrottledKw)} kW headroom was constrained across ${latestAllocations.length} optimization cycles to protect site transformer limits and tenant floor guarantees.`,
      primaryBottleneck,
      samplesAnalyzed: latestAllocations.length,
      recommendation: 'Consider shifting non-urgent vehicle departures past 06:30 AM or upgrading site peak transformer capacity.',
    };
  }

  @Post(':id/renegotiate')
  async renegotiatePromise(
    @Param('id') id: string,
    @Body() body: { optionId: number; action: string }
  ) {
    const promise = await this.promiseRepo.findOne({
      where: { sessionId: id },
    });

    if (promise) {
      if (body.action === 'PUSH_DEPARTURE') {
        const session = await this.sessionRepo.findOne({ where: { id } });
        if (session) {
          session.departureTime = new Date(Date.now() + 45 * 60 * 1000); // Push 45 min
          await this.sessionRepo.save(session);
        }
        promise.state = 'ACTIVE';
        promise.confidence = 'HIGH';
      } else if (body.action === 'ACCEPT_LOWER_SOC') {
        promise.promisedSoc = 75.0; // Lower target SoC
        promise.state = 'ACTIVE';
        promise.confidence = 'MEDIUM';
      } else if (body.action === 'BUY_PRIORITY') {
        promise.state = 'ACTIVE';
        promise.confidence = 'HIGH';
      }
      await this.promiseRepo.save(promise);
    }

    return { status: 'SUCCESS', message: 'Promise renegotiated successfully' };
  }
}
