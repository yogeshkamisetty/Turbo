import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  role: string; // 'ADMIN', 'TENANT_MGR', 'DRIVER'

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('numeric', { name: 'cap_kw' })
  capKw: number;

  @Column('numeric', { name: 'cap_phase_a' })
  capPhaseA: number;

  @Column('numeric', { name: 'cap_phase_b' })
  capPhaseB: number;

  @Column('numeric', { name: 'cap_phase_c' })
  capPhaseC: number;

  @Column('numeric', { name: 'base_load_kw', default: 0 })
  baseLoadKw: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('circuits')
export class Circuit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column()
  name: string;

  @Column('numeric', { name: 'cap_kw' })
  capKw: number;

  @Column({ name: 'parent_circuit_id', nullable: true })
  parentCircuitId: string;
}

@Entity('tariffs')
export class Tariff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column()
  dow: number;

  @Column({ name: 'start_min' })
  startMin: number;

  @Column({ name: 'end_min' })
  endMin: number;

  @Column('numeric', { name: 'price_per_kwh' })
  pricePerKwh: number;

  @Column('numeric', { name: 'demand_charge_per_kw' })
  demandChargePerKw: number;

  @Column('numeric', { name: 'carbon_gco2_per_kwh', default: 250.0 })
  carbonGco2PerKwh: number;
}

@Entity('fairness_ledger')
export class FairnessLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column('numeric', { name: 'debt_kwh', default: 0 })
  debtKwh: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('entitlements')
export class Entitlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column('numeric', { name: 'floor_kw' })
  floorKw: number;

  @Column('numeric', { name: 'tier_weight', default: 1.0 })
  tierWeight: number;

  @Column({ name: 'valid_from', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', nullable: true })
  validTo: Date;
}

@Entity('chargers')
export class Charger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column({ name: 'circuit_id', nullable: true })
  circuitId: string;

  @Column({ name: 'ocpp_id', unique: true })
  ocppId: string;

  @Column({ default: 'SwitchyardSim' })
  vendor: string;

  @Column({ default: 'SY-22KW' })
  model: string;

  @Column('numeric', { name: 'max_kw', default: 22 })
  maxKw: number;

  @Column({ default: 'Available' })
  status: string;

  @Column({ name: 'phase_assignment', default: 'L1,L2,L3' })
  phaseAssignment: string;
}

@Entity('connectors')
export class Connector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'charger_id' })
  chargerId: string;

  @Column({ name: 'connector_index', default: 1 })
  connectorIndex: number;

  @Column({ default: 'Available' })
  status: string;

  @Column({ name: 'current_session_id', nullable: true })
  currentSessionId: string;
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column('numeric', { name: 'battery_capacity_kwh' })
  batteryCapacityKwh: number;

  @Column('numeric', { name: 'max_charge_rate_kw', default: 22 })
  maxChargeRateKw: number;

  @Column('numeric', { name: 'min_charge_rate_kw', default: 4.14 })
  minChargeRateKw: number;
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @Column({ name: 'charger_id' })
  chargerId: string;

  @Column({ name: 'connector_index', default: 1 })
  connectorIndex: number;

  @CreateDateColumn({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'departure_time' })
  departureTime: Date;

  @Column('numeric', { name: 'start_soc' })
  startSoc: number;

  @Column('numeric', { name: 'current_soc' })
  currentSoc: number;

  @Column('numeric', { name: 'target_soc' })
  targetSoc: number;

  @Column('numeric', { name: 'allocated_kw', default: 0 })
  allocatedKw: number;

  @Column('numeric', { name: 'measured_kw', default: 0 })
  measuredKw: number;

  @Column('numeric', { name: 'delivered_kwh', default: 0 })
  deliveredKwh: number;

  @Column({ default: 'PluggedIn' })
  state: string;

  @Column({ name: 'phase_assignment', default: 'L1,L2,L3' })
  phaseAssignment: string;
}

@Entity('allocations')
export class Allocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'ts' })
  ts: Date;

  @Column('numeric', { name: 'allocated_kw' })
  allocatedKw: number;

  @Column({ default: 2 })
  tier: number;

  @Column({ name: 'binding_constraint', nullable: true })
  bindingConstraint: string;

  @Column('numeric', { name: 'shadow_price', default: 0 })
  shadowPrice: number;

  @Column({ name: 'reason_text', nullable: true })
  reasonText: string;
}

@Entity('charge_promises')
export class ChargePromise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column('numeric', { name: 'promised_soc' })
  promisedSoc: number;

  @Column({ name: 'promised_by' })
  promisedBy: Date;

  @Column({ default: 'HIGH' })
  confidence: string;

  @Column({ default: 'ACTIVE' })
  state: string;

  @Column({ name: 'renegotiated_from', nullable: true })
  renegotiatedFrom: string;
}

@Entity('capacity_credits')
export class CapacityCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column()
  period: string;

  @Column('numeric', { name: 'released_kwh', default: 0 })
  releasedKwh: number;

  @Column('numeric', { name: 'credit_amount', default: 0 })
  creditAmount: number;
}
