import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import {
  User, Tenant, Site, Circuit, Tariff, Entitlement,
  Charger, Connector, Vehicle, Session, Allocation, ChargePromise, CapacityCredit, FairnessLedger
} from './entities';
import { TenantsController } from './tenants/tenants.controller';
import { SitesController } from './sites/sites.controller';
import { ChargersController } from './chargers/chargers.controller';
import { SessionsController } from './sessions/sessions.controller';
import { BillingController } from './billing/billing.controller';
import { OptimizerClientService } from './optimizer-client/optimizer.service';
import { AppWsGateway } from './ws/ws.gateway';
import { SchedulerService } from './scheduler/scheduler.service';

const entities = [
  User, Tenant, Site, Circuit, Tariff, Entitlement,
  Charger, Connector, Vehicle, Session, Allocation, ChargePromise, CapacityCredit, FairnessLedger
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_switchyard_jwt_key_2026',
    }),
    // 1. Default DataSource (app_user non-owner role — RLS ENFORCED)
    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: 'app_user',
      password: 'app_user_secret',
      database: process.env.POSTGRES_DB || 'switchyard',
      entities,
      synchronize: false,
    }),
    // 2. Optimizer DataSource (optimizer_role BYPASSRLS role — Site-wide Cron context)
    TypeOrmModule.forRoot({
      name: 'optimizer',
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: 'optimizer_role',
      password: 'optimizer_secret',
      database: process.env.POSTGRES_DB || 'switchyard',
      entities,
      synchronize: false,
    }),
    TypeOrmModule.forFeature(entities, 'default'),
    TypeOrmModule.forFeature(entities, 'optimizer'),
    AuthModule,
  ],
  controllers: [
    TenantsController,
    SitesController,
    ChargersController,
    SessionsController,
    BillingController,
  ],
  providers: [
    OptimizerClientService,
    AppWsGateway,
    SchedulerService,
  ],
})
export class AppModule {}
