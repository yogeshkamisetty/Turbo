import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Session, Site, Entitlement, Charger, Vehicle, Allocation, ChargePromise, Tariff, FairnessLedger } from '../entities';
import { OptimizerClientService } from '../optimizer-client/optimizer.service';
import { AppWsGateway } from '../ws/ws.gateway';
import Redis from 'ioredis';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private redisPublisher: Redis;

  constructor(
    @InjectRepository(Session, 'optimizer')
    private sessionRepo: Repository<Session>,
    @InjectRepository(Site, 'optimizer')
    private siteRepo: Repository<Site>,
    @InjectRepository(Entitlement, 'optimizer')
    private entitlementRepo: Repository<Entitlement>,
    @InjectRepository(Charger, 'optimizer')
    private chargerRepo: Repository<Charger>,
    @InjectRepository(Vehicle, 'optimizer')
    private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Allocation, 'optimizer')
    private allocationRepo: Repository<Allocation>,
    @InjectRepository(ChargePromise, 'optimizer')
    private promiseRepo: Repository<ChargePromise>,
    @InjectRepository(Tariff, 'optimizer')
    private tariffRepo: Repository<Tariff>,
    @InjectRepository(FairnessLedger, 'optimizer')
    private fairnessRepo: Repository<FairnessLedger>,
    private optimizerService: OptimizerClientService,
    private wsGateway: AppWsGateway,
  ) {
    this.redisPublisher = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runHorizonPlanningCycle() {
    this.logger.log('Starting Stage A 12-hour LP horizon planning cycle...');

    const site = await this.siteRepo.findOne({ where: {} });
    if (!site) return;

    const activeSessions = await this.sessionRepo.find({
      where: { state: In(['PluggedIn', 'Charging', 'Throttled']) },
    });

    if (activeSessions.length === 0) return;

    const vehicles = await this.vehicleRepo.find({ where: {} });
    const tariffs = await this.tariffRepo.find({ where: { siteId: site.id } });
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

    // Read real carbon_gco2_per_kwh and price_per_kwh from tariffs table
    const buckets = Array.from({ length: 48 }, (_, i) => {
      const matchedTariff = tariffs.find(t => t.dow === 1 && i >= (t.startMin/15) && i <= (t.endMin/15));
      return {
        bucket_index: i,
        tariff_price: matchedTariff ? parseFloat(matchedTariff.pricePerKwh as any) : 0.15,
        carbon_gco2_per_kwh: matchedTariff ? parseFloat(matchedTariff.carbonGco2PerKwh as any || 250) : 250.0,
      };
    });

    const planReq = {
      site_cap_kw: parseFloat(site.capKw as any),
      demand_charge_per_kw: 15.0,
      buckets,
      sessions: activeSessions.map(s => {
        const vehicle = s.vehicleId ? vehicleMap.get(s.vehicleId) : null;
        return {
          session_id: s.id,
          tenant_id: s.tenantId,
          charger_id: s.chargerId,
          current_soc: parseFloat(s.currentSoc as any),
          target_soc: parseFloat(s.targetSoc as any),
          battery_capacity_kwh: vehicle ? parseFloat(vehicle.batteryCapacityKwh as any) : 80,
          max_charge_rate_kw: vehicle ? parseFloat(vehicle.maxChargeRateKw as any) : 22,
          departure_time_iso: s.departureTime ? s.departureTime.toISOString() : new Date(Date.now() + 4*3600*1000).toISOString(),
        };
      }),
    };

    const currentBucketIndex = Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) / 15);
    await this.sessionRepo.query(
      `INSERT INTO arrival_patterns (site_id, bucket_index, avg_active_sessions, avg_base_load_kw, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (site_id, bucket_index) DO UPDATE SET
         avg_active_sessions = (arrival_patterns.avg_active_sessions * 0.8) + (EXCLUDED.avg_active_sessions * 0.2),
         avg_base_load_kw = (arrival_patterns.avg_base_load_kw * 0.8) + (EXCLUDED.avg_base_load_kw * 0.2),
         updated_at = NOW()`,
      [site.id, currentBucketIndex, activeSessions.length, parseFloat(site.baseLoadKw as any || 5.0)]
    ).catch(() => {});

    const planResult = await this.optimizerService.plan(planReq);
    if (planResult) {
      this.logger.log(`Stage A Horizon Planner successful! Optimized Peak Draw: ${planResult.peak_draw_kw} kW`);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async runOptimizationCycle() {
    this.logger.log('Starting Stage B real-time optimization cycle...');

    const site = await this.siteRepo.findOne({ where: {} });
    if (!site) return;

    const activeSessions = await this.sessionRepo.find({
      where: { state: In(['PluggedIn', 'Charging', 'Throttled']) },
    });

    if (activeSessions.length === 0) {
      this.logger.log('No active charging sessions found');
      return;
    }

    const entitlements = await this.entitlementRepo.find({ where: { siteId: site.id } });
    const chargers = await this.chargerRepo.find({ where: { siteId: site.id } });
    const vehicles = await this.vehicleRepo.find({ where: {} });
    const fairnessLedgers = await this.fairnessRepo.find({ where: {} });
    const tariffs = await this.tariffRepo.find({ where: { siteId: site.id } });

    const chargerMap = new Map(chargers.map(c => [c.id, c]));
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
    const fairnessMap = new Map(fairnessLedgers.map(f => [f.sessionId, f]));

    const currentTariff = tariffs[0];
    const tariffPriceNow = currentTariff ? parseFloat(currentTariff.pricePerKwh as any) : 0.15;
    const carbonGco2Now = currentTariff ? parseFloat(currentTariff.carbonGco2PerKwh as any || 250) : 250.0;

    const circuits = await this.sessionRepo.query(`SELECT id, cap_kw FROM circuits WHERE site_id = $1`, [site.id]);

    // Format request for Python optimizer
    const optimizerReq = {
      site_cap_kw: parseFloat(site.capKw as any),
      base_load_kw: parseFloat(site.baseLoadKw as any),
      phases: {
        L1: parseFloat(site.capPhaseA as any),
        L2: parseFloat(site.capPhaseB as any),
        L3: parseFloat(site.capPhaseC as any),
      },
      circuits: circuits.map(c => ({
        circuit_id: c.id,
        cap_kw: parseFloat(c.cap_kw),
      })),
      entitlements: entitlements.map(e => ({
        tenant_id: e.tenantId,
        floor_kw: parseFloat(e.floorKw as any),
        tier_weight: parseFloat(e.tierWeight as any),
      })),
      sessions: activeSessions.map(s => {
        const charger = chargerMap.get(s.chargerId);
        const vehicle = s.vehicleId ? vehicleMap.get(s.vehicleId) : null;
        const fairness = fairnessMap.get(s.id);
        return {
          session_id: s.id,
          tenant_id: s.tenantId,
          charger_id: s.chargerId,
          circuit_id: charger ? charger.circuitId : null,
          connector_index: s.connectorIndex,
          current_soc: parseFloat(s.currentSoc as any),
          target_soc: parseFloat(s.targetSoc as any),
          battery_capacity_kwh: vehicle ? parseFloat(vehicle.batteryCapacityKwh as any) : 80,
          max_charge_rate_kw: vehicle ? parseFloat(vehicle.maxChargeRateKw as any) : 22,
          min_charge_rate_kw: vehicle ? parseFloat(vehicle.minChargeRateKw as any) : 4.14,
          departure_time_iso: s.departureTime ? s.departureTime.toISOString() : new Date(Date.now() + 4*3600*1000).toISOString(),
          phase_assignment: s.phaseAssignment || 'L1,L2,L3',
          previous_kw: parseFloat(s.measuredKw as any || s.allocatedKw as any),
          debt_kwh: fairness ? parseFloat(fairness.debtKwh as any || 0) : 0.0,
        };
      }),
      tariff_price_now: tariffPriceNow,
      carbon_gco2_per_kwh: carbonGco2Now,
    };

    const result = await this.optimizerService.allocate(optimizerReq);

    if (result && result.allocations) {
      for (const item of result.allocations) {
        const session = activeSessions.find(s => s.id === item.session_id);
        const charger = session ? chargerMap.get(session.chargerId) : null;

        if (session && charger) {
          session.allocatedKw = item.allocated_kw;
          session.state = item.is_paused ? 'Paused' : item.allocated_kw > 0 ? 'Charging' : 'Throttled';
          await this.sessionRepo.save(session);

          // Save Allocation Receipt (D2)
          await this.allocationRepo.save({
            sessionId: session.id,
            tenantId: session.tenantId,
            allocatedKw: item.allocated_kw,
            tier: item.tier,
            bindingConstraint: item.binding_constraint,
            shadowPrice: item.shadow_price,
            reasonText: item.reason_text,
          });

          // Fairness debt write-back (Anti-starvation rotation)
          const fairShareKw = parseFloat(site.capKw as any) / Math.max(1, activeSessions.length);
          const deficitKwh = (fairShareKw - item.allocated_kw) * (30.0 / 3600.0);
          
          let fairness = fairnessMap.get(session.id);
          if (!fairness) {
            fairness = this.fairnessRepo.create({
              sessionId: session.id,
              tenantId: session.tenantId,
              debtKwh: Math.max(0, deficitKwh),
            });
          } else {
            fairness.debtKwh = (parseFloat(fairness.debtKwh as any || 0) * 0.9) + Math.max(0, deficitKwh);
          }
          await this.fairnessRepo.save(fairness);

          // Dispatch profile to charger via Redis
          await this.redisPublisher.publish('allocation:dispatch', JSON.stringify({
            ocppId: charger.ocppId,
            connectorId: session.connectorIndex,
            allocatedKw: item.allocated_kw,
          }));

          // Check & update D3 Charge Promises
          await this.reevaluatePromise(session, item.allocated_kw, vehicleMap.get(session.vehicleId));

          // Broadcast to tenant WebSocket room
          this.wsGateway.broadcastToTenant(session.tenantId, 'allocation:update', {
            sessionId: session.id,
            allocatedKw: item.allocated_kw,
            state: session.state,
            receipt: {
              bindingConstraint: item.binding_constraint,
              shadowPrice: item.shadow_price,
              reasonText: item.reason_text,
            },
          });
        }
      }

      const tenantPowerMap: Record<string, number> = {};
      for (const item of result.allocations) {
        const session = activeSessions.find(s => s.id === item.session_id);
        if (session) {
          tenantPowerMap[session.tenantId] = Math.round(((tenantPowerMap[session.tenantId] || 0) + item.allocated_kw) * 10) / 10;
        }
      }

      this.wsGateway.broadcastAll('site:power_update', {
        timestamp: new Date().toISOString(),
        totalAllocatedKw: result.site_total_allocated_kw,
        tenantPowerMap,
        siteCapKw: parseFloat(site.capKw as any),
        tier: 2,
      });
    }
  }

  private async reevaluatePromise(session: Session, allocatedKw: number, vehicle: Vehicle) {
    const promise = await this.promiseRepo.findOne({
      where: { sessionId: session.id, state: 'ACTIVE' },
    });

    if (!promise) return;

    const remainingSoc = Math.max(0, promise.promisedSoc - session.currentSoc);
    const capacityKwh = vehicle ? parseFloat(vehicle.batteryCapacityKwh as any) : 80;
    const remainingKwh = (remainingSoc / 100) * capacityKwh;

    const hoursNeededAtAlloc = allocatedKw > 0 ? remainingKwh / allocatedKw : 999;
    const now = new Date();
    const promisedBy = new Date(promise.promisedBy);
    const hoursAvailable = (promisedBy.getTime() - now.getTime()) / (3600 * 1000);

    if (hoursNeededAtAlloc > hoursAvailable) {
      const siblingSessions = await this.sessionRepo.find({
        where: { tenantId: session.tenantId },
      });

      const idleSibling = siblingSessions.find(s => s.id !== session.id && (parseFloat(s.currentSoc as any) >= parseFloat(s.targetSoc as any) || s.state === 'Paused'));

      if (idleSibling) {
        this.logger.log(`[D3 Promise Protection] Silently shifting 5 kW capacity from sibling session ${idleSibling.id} to session ${session.id}`);
        idleSibling.allocatedKw = Math.max(0, parseFloat(idleSibling.allocatedKw as any) - 5.0);
        session.allocatedKw = parseFloat(session.allocatedKw as any) + 5.0;
        await this.sessionRepo.save([idleSibling, session]);

        promise.confidence = 'HIGH';
        await this.promiseRepo.save(promise);
        return;
      }

      if (promise.state !== 'RENEGOTIATING') {
        promise.state = 'RENEGOTIATING';
        promise.confidence = 'LOW';
        await this.promiseRepo.save(promise);

        this.wsGateway.broadcastToTenant(session.tenantId, 'promise:conflict', {
          promiseId: promise.id,
          sessionId: session.id,
          promisedSoc: promise.promisedSoc,
          currentSoc: session.currentSoc,
          promisedBy: promise.promisedBy,
          options: [
            { id: 1, text: `Push departure to ${new Date(now.getTime() + hoursNeededAtAlloc*3600*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, action: 'PUSH_DEPARTURE' },
            { id: 2, text: `Accept ${Math.floor(session.currentSoc + (hoursAvailable * allocatedKw / capacityKwh)*100)}% SoC`, action: 'ACCEPT_LOWER_SOC' },
            { id: 3, text: `Spend 12 release-credits to buy priority from surplus pool`, action: 'BUY_PRIORITY' },
          ],
        });
      }
    }
  }
}
