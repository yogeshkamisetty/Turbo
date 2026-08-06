export type ChargerStatus = 'charging' | 'available' | 'queued' | 'optimized' | 'throttled' | 'fault' | 'offline'

export interface Charger {
  id: string
  name: string
  status: ChargerStatus
  power: number
  maxPower: number
  voltage: number
  current: number
  temperature: number
  location: string
  connector: string
  tenant: string
  vehicle?: string
  driver?: string
  sessionStart?: string
  energy?: number
}

export interface Session {
  id: string
  chargerId: string
  vehicle: string
  driver: string
  battery: number
  power: number
  status: ChargerStatus
  priority: 'high' | 'medium' | 'low'
  startTime: string
  energy: number
  cost: number
  tenant: string
}

export interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  plate: string
  battery: number
  soc: number
  priority: 'high' | 'medium' | 'low'
  driver: string
  charging: boolean
  expectedFinish: string
  speed: number
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  tenant: string
  vehicle: string
  sessions: number
  energy: number
  cost: number
  status: 'active' | 'idle' | 'offline'
}

export interface Tenant {
  id: string
  name: string
  chargers: number
  active: number
  energy: number
  cost: number
  plan: string
  drivers: number
}

export interface Invoice {
  id: string
  tenant: string
  date: string
  kwh: number
  cost: number
  status: 'paid' | 'pending' | 'overdue'
}

export const chargers: Charger[] = [
  { id: 'CHG-101', name: 'Charger 101', status: 'charging', power: 45, maxPower: 50, voltage: 400, current: 112, temperature: 42, location: 'Zone A - Bay 1', connector: 'CCS2', tenant: 'Tesla Fleet', vehicle: 'Tesla Model Y', driver: 'James Carter', sessionStart: '09:14', energy: 18.4 },
  { id: 'CHG-102', name: 'Charger 102', status: 'charging', power: 22, maxPower: 22, voltage: 230, current: 96, temperature: 38, location: 'Zone A - Bay 2', connector: 'Type 2', tenant: 'Rivian Corp', vehicle: 'Rivian R1T', driver: 'Sofia Martinez', sessionStart: '08:52', energy: 11.2 },
  { id: 'CHG-103', name: 'Charger 103', status: 'available', power: 0, maxPower: 150, voltage: 800, current: 0, temperature: 31, location: 'Zone A - Bay 3', connector: 'CCS2', tenant: 'Tesla Fleet' },
  { id: 'CHG-104', name: 'Charger 104', status: 'throttled', power: 18, maxPower: 50, voltage: 400, current: 45, temperature: 54, location: 'Zone B - Bay 1', connector: 'CCS2', tenant: 'Rivian Corp', vehicle: 'Rivian R1S', driver: 'Liam Thompson', sessionStart: '09:30', energy: 6.1 },
  { id: 'CHG-105', name: 'Charger 105', status: 'optimized', power: 30, maxPower: 50, voltage: 400, current: 75, temperature: 40, location: 'Zone B - Bay 2', connector: 'CCS2', tenant: 'Green Wheels', vehicle: 'BMW iX', driver: 'Amara Okonkwo', sessionStart: '09:02', energy: 14.8 },
  { id: 'CHG-106', name: 'Charger 106', status: 'charging', power: 150, maxPower: 150, voltage: 800, current: 187, temperature: 61, location: 'Zone B - Bay 3', connector: 'CCS2', tenant: 'Tesla Fleet', vehicle: 'Tesla Model 3', driver: 'Noah Kim', sessionStart: '09:45', energy: 32.7 },
  { id: 'CHG-107', name: 'Charger 107', status: 'fault', power: 0, maxPower: 50, voltage: 0, current: 0, temperature: 78, location: 'Zone C - Bay 1', connector: 'CHAdeMO', tenant: 'City Mobility' },
  { id: 'CHG-108', name: 'Charger 108', status: 'offline', power: 0, maxPower: 22, voltage: 0, current: 0, temperature: 22, location: 'Zone C - Bay 2', connector: 'Type 2', tenant: 'City Mobility' },
  { id: 'CHG-109', name: 'Charger 109', status: 'queued', power: 0, maxPower: 100, voltage: 400, current: 0, temperature: 33, location: 'Zone C - Bay 3', connector: 'CCS2', tenant: 'Green Wheels', vehicle: 'Audi e-tron', driver: 'Elena Vasquez', sessionStart: '10:00', energy: 0 },
  { id: 'CHG-110', name: 'Charger 110', status: 'charging', power: 75, maxPower: 100, voltage: 400, current: 187, temperature: 47, location: 'Zone D - Bay 1', connector: 'CCS2', tenant: 'Tesla Fleet', vehicle: 'Tesla Model S', driver: 'Oliver Park', sessionStart: '08:30', energy: 41.3 },
  { id: 'CHG-111', name: 'Charger 111', status: 'available', power: 0, maxPower: 50, voltage: 400, current: 0, temperature: 29, location: 'Zone D - Bay 2', connector: 'CCS2', tenant: 'Rivian Corp' },
  { id: 'CHG-112', name: 'Charger 112', status: 'charging', power: 22, maxPower: 22, voltage: 230, current: 96, temperature: 37, location: 'Zone D - Bay 3', connector: 'Type 2', tenant: 'Green Wheels', vehicle: 'VW ID.4', driver: 'Maya Patel', sessionStart: '09:20', energy: 9.6 },
]

export const sessions: Session[] = [
  { id: 'SES-2841', chargerId: 'CHG-101', vehicle: 'Tesla Model Y', driver: 'James Carter', battery: 68, power: 45, status: 'charging', priority: 'high', startTime: '09:14', energy: 18.4, cost: 5.52, tenant: 'Tesla Fleet' },
  { id: 'SES-2842', chargerId: 'CHG-102', vehicle: 'Rivian R1T', driver: 'Sofia Martinez', battery: 42, power: 22, status: 'charging', priority: 'medium', startTime: '08:52', energy: 11.2, cost: 3.36, tenant: 'Rivian Corp' },
  { id: 'SES-2843', chargerId: 'CHG-104', vehicle: 'Rivian R1S', driver: 'Liam Thompson', battery: 55, power: 18, status: 'throttled', priority: 'low', startTime: '09:30', energy: 6.1, cost: 1.83, tenant: 'Rivian Corp' },
  { id: 'SES-2844', chargerId: 'CHG-105', vehicle: 'BMW iX', driver: 'Amara Okonkwo', battery: 71, power: 30, status: 'optimized', priority: 'medium', startTime: '09:02', energy: 14.8, cost: 4.44, tenant: 'Green Wheels' },
  { id: 'SES-2845', chargerId: 'CHG-106', vehicle: 'Tesla Model 3', driver: 'Noah Kim', battery: 88, power: 150, status: 'charging', priority: 'high', startTime: '09:45', energy: 32.7, cost: 9.81, tenant: 'Tesla Fleet' },
  { id: 'SES-2846', chargerId: 'CHG-109', vehicle: 'Audi e-tron', driver: 'Elena Vasquez', battery: 12, power: 0, status: 'queued', priority: 'high', startTime: '10:00', energy: 0, cost: 0, tenant: 'Green Wheels' },
  { id: 'SES-2847', chargerId: 'CHG-110', vehicle: 'Tesla Model S', driver: 'Oliver Park', battery: 92, power: 75, status: 'charging', priority: 'medium', startTime: '08:30', energy: 41.3, cost: 12.39, tenant: 'Tesla Fleet' },
  { id: 'SES-2848', chargerId: 'CHG-112', vehicle: 'VW ID.4', driver: 'Maya Patel', battery: 61, power: 22, status: 'charging', priority: 'low', startTime: '09:20', energy: 9.6, cost: 2.88, tenant: 'Green Wheels' },
]

export const vehicles: Vehicle[] = [
  { id: 'VEH-001', name: 'Tesla Model Y', make: 'Tesla', model: 'Model Y', plate: 'TES-1234', battery: 100, soc: 68, priority: 'high', driver: 'James Carter', charging: true, expectedFinish: '11:30', speed: 45 },
  { id: 'VEH-002', name: 'Rivian R1T', make: 'Rivian', model: 'R1T', plate: 'RVN-5678', battery: 135, soc: 42, priority: 'medium', driver: 'Sofia Martinez', charging: true, expectedFinish: '12:15', speed: 22 },
  { id: 'VEH-003', name: 'Rivian R1S', make: 'Rivian', model: 'R1S', plate: 'RVN-9012', battery: 135, soc: 55, priority: 'low', driver: 'Liam Thompson', charging: true, expectedFinish: '13:40', speed: 18 },
  { id: 'VEH-004', name: 'BMW iX', make: 'BMW', model: 'iX xDrive50', plate: 'BMW-3456', battery: 111, soc: 71, priority: 'medium', driver: 'Amara Okonkwo', charging: true, expectedFinish: '11:45', speed: 30 },
  { id: 'VEH-005', name: 'Tesla Model 3', make: 'Tesla', model: 'Model 3 LR', plate: 'TES-7890', battery: 82, soc: 88, priority: 'high', driver: 'Noah Kim', charging: true, expectedFinish: '10:30', speed: 150 },
  { id: 'VEH-006', name: 'Audi e-tron', make: 'Audi', model: 'e-tron GT', plate: 'AUD-2345', battery: 93, soc: 12, priority: 'high', driver: 'Elena Vasquez', charging: false, expectedFinish: '14:20', speed: 0 },
  { id: 'VEH-007', name: 'Tesla Model S', make: 'Tesla', model: 'Model S Plaid', plate: 'TES-6789', battery: 100, soc: 92, priority: 'medium', driver: 'Oliver Park', charging: true, expectedFinish: '10:15', speed: 75 },
  { id: 'VEH-008', name: 'VW ID.4', make: 'Volkswagen', model: 'ID.4 Pro', plate: 'VWG-4321', battery: 77, soc: 61, priority: 'low', driver: 'Maya Patel', charging: true, expectedFinish: '12:50', speed: 22 },
]

export const drivers: Driver[] = [
  { id: 'DRV-001', name: 'James Carter', email: 'j.carter@tesla.com', phone: '+1 415-234-5678', tenant: 'Tesla Fleet', vehicle: 'Tesla Model Y', sessions: 142, energy: 4210, cost: 1263, status: 'active' },
  { id: 'DRV-002', name: 'Sofia Martinez', email: 's.martinez@rivian.com', phone: '+1 310-876-5432', tenant: 'Rivian Corp', vehicle: 'Rivian R1T', sessions: 98, energy: 3180, cost: 954, status: 'active' },
  { id: 'DRV-003', name: 'Liam Thompson', email: 'l.thompson@rivian.com', phone: '+1 312-543-2109', tenant: 'Rivian Corp', vehicle: 'Rivian R1S', sessions: 74, energy: 2640, cost: 792, status: 'active' },
  { id: 'DRV-004', name: 'Amara Okonkwo', email: 'a.okonkwo@greenwheels.io', phone: '+1 646-987-6543', tenant: 'Green Wheels', vehicle: 'BMW iX', sessions: 119, energy: 3870, cost: 1161, status: 'active' },
  { id: 'DRV-005', name: 'Noah Kim', email: 'n.kim@tesla.com', phone: '+1 650-345-6789', tenant: 'Tesla Fleet', vehicle: 'Tesla Model 3', sessions: 211, energy: 7440, cost: 2232, status: 'active' },
  { id: 'DRV-006', name: 'Elena Vasquez', email: 'e.vasquez@greenwheels.io', phone: '+1 512-654-3210', tenant: 'Green Wheels', vehicle: 'Audi e-tron', sessions: 56, energy: 1920, cost: 576, status: 'idle' },
  { id: 'DRV-007', name: 'Oliver Park', email: 'o.park@tesla.com', phone: '+1 408-789-0123', tenant: 'Tesla Fleet', vehicle: 'Tesla Model S', sessions: 183, energy: 6210, cost: 1863, status: 'active' },
  { id: 'DRV-008', name: 'Maya Patel', email: 'm.patel@greenwheels.io', phone: '+1 415-210-9876', tenant: 'Green Wheels', vehicle: 'VW ID.4', sessions: 87, energy: 2890, cost: 867, status: 'active' },
]

export const tenants: Tenant[] = [
  { id: 'TEN-001', name: 'Tesla Fleet', chargers: 42, active: 38, energy: 18640, cost: 5592, plan: 'Enterprise', drivers: 24 },
  { id: 'TEN-002', name: 'Rivian Corp', chargers: 28, active: 24, energy: 11280, cost: 3384, plan: 'Business', drivers: 16 },
  { id: 'TEN-003', name: 'Green Wheels', chargers: 35, active: 31, energy: 14920, cost: 4476, plan: 'Enterprise', drivers: 21 },
  { id: 'TEN-004', name: 'City Mobility', chargers: 12, active: 8, energy: 4810, cost: 1443, plan: 'Starter', drivers: 8 },
  { id: 'TEN-005', name: 'EcoFleet GmbH', chargers: 8, active: 6, energy: 2960, cost: 888, plan: 'Starter', drivers: 5 },
]

export const invoices: Invoice[] = [
  { id: 'INV-2024-001', tenant: 'Tesla Fleet', date: '2025-01-01', kwh: 18640, cost: 5592.00, status: 'paid' },
  { id: 'INV-2024-002', tenant: 'Rivian Corp', date: '2025-01-01', kwh: 11280, cost: 3384.00, status: 'paid' },
  { id: 'INV-2024-003', tenant: 'Green Wheels', date: '2025-01-01', kwh: 14920, cost: 4476.00, status: 'paid' },
  { id: 'INV-2024-004', tenant: 'City Mobility', date: '2025-01-01', kwh: 4810, cost: 1443.00, status: 'pending' },
  { id: 'INV-2023-012', tenant: 'Tesla Fleet', date: '2024-12-01', kwh: 17210, cost: 5163.00, status: 'paid' },
  { id: 'INV-2023-011', tenant: 'Rivian Corp', date: '2024-12-01', kwh: 10840, cost: 3252.00, status: 'paid' },
  { id: 'INV-2023-010', tenant: 'Green Wheels', date: '2024-12-01', kwh: 13680, cost: 4104.00, status: 'paid' },
  { id: 'INV-2023-009', tenant: 'City Mobility', date: '2024-12-01', kwh: 4210, cost: 1263.00, status: 'overdue' },
  { id: 'INV-2023-008', tenant: 'EcoFleet GmbH', date: '2024-12-01', kwh: 2960, cost: 888.00, status: 'paid' },
  { id: 'INV-2023-007', tenant: 'Tesla Fleet', date: '2024-11-01', kwh: 16480, cost: 4944.00, status: 'paid' },
]

export const powerData = [
  { time: '00:00', power: 2.1, grid: 2.8 },
  { time: '01:00', power: 1.8, grid: 2.2 },
  { time: '02:00', power: 1.4, grid: 1.8 },
  { time: '03:00', power: 1.2, grid: 1.5 },
  { time: '04:00', power: 1.6, grid: 2.0 },
  { time: '05:00', power: 2.8, grid: 3.4 },
  { time: '06:00', power: 4.2, grid: 5.1 },
  { time: '07:00', power: 6.8, grid: 7.9 },
  { time: '08:00', power: 9.4, grid: 11.2 },
  { time: '09:00', power: 12.1, grid: 14.6 },
  { time: '10:00', power: 14.8, grid: 17.2 },
  { time: '11:00', power: 15.6, grid: 18.4 },
  { time: '12:00', power: 16.2, grid: 19.1 },
  { time: '13:00', power: 17.4, grid: 20.3 },
  { time: '14:00', power: 18.1, grid: 21.0 },
  { time: '15:00', power: 17.8, grid: 20.8 },
  { time: '16:00', power: 16.4, grid: 19.2 },
  { time: '17:00', power: 14.2, grid: 16.8 },
  { time: '18:00', power: 13.6, grid: 16.1 },
  { time: '19:00', power: 11.8, grid: 14.0 },
  { time: '20:00', power: 9.6, grid: 11.4 },
  { time: '21:00', power: 7.4, grid: 8.8 },
  { time: '22:00', power: 5.2, grid: 6.4 },
  { time: '23:00', power: 3.4, grid: 4.1 },
]

export const energyByTenant = [
  { tenant: 'Tesla Fleet', energy: 18640, sessions: 514 },
  { tenant: 'Rivian Corp', energy: 11280, sessions: 312 },
  { tenant: 'Green Wheels', energy: 14920, sessions: 428 },
  { tenant: 'City Mobility', energy: 4810, sessions: 148 },
  { tenant: 'EcoFleet', energy: 2960, sessions: 96 },
]

export const powerDistribution = [
  { name: 'Charging', value: 62, color: '#00E676' },
  { name: 'Idle', value: 24, color: '#3B82F6' },
  { name: 'Reserved', value: 9, color: '#F59E0B' },
  { name: 'Fault', value: 5, color: '#EF4444' },
]

export const heatmapData = [
  { day: 'Mon', h0: 12, h3: 8, h6: 34, h9: 78, h12: 91, h15: 86, h18: 74, h21: 45 },
  { day: 'Tue', h0: 10, h3: 7, h6: 38, h9: 82, h12: 88, h15: 91, h18: 79, h21: 51 },
  { day: 'Wed', h0: 14, h3: 9, h6: 41, h9: 86, h12: 94, h15: 89, h18: 81, h21: 48 },
  { day: 'Thu', h0: 11, h3: 8, h6: 36, h9: 79, h12: 87, h15: 84, h18: 76, h21: 44 },
  { day: 'Fri', h0: 13, h3: 10, h6: 44, h9: 88, h12: 96, h15: 93, h18: 86, h21: 58 },
  { day: 'Sat', h0: 22, h3: 16, h6: 28, h9: 52, h12: 64, h15: 68, h18: 61, h21: 42 },
  { day: 'Sun', h0: 18, h3: 12, h6: 21, h9: 44, h12: 58, h15: 62, h18: 54, h21: 36 },
]

export const alerts = [
  { id: 'ALT-001', type: 'fault', title: 'Charger Offline', message: 'CHG-107 has gone offline unexpectedly. Temperature exceeded threshold (78°C).', time: '2 min ago', read: false },
  { id: 'ALT-002', type: 'warning', title: 'Power Reduced', message: 'Grid demand exceeded 18 MW. Load balancing throttled CHG-104 to 18 kW.', time: '8 min ago', read: false },
  { id: 'ALT-003', type: 'success', title: 'Battery Full', message: 'Tesla Model S (TES-6789) reached 100% SoC on CHG-110. Session ended.', time: '14 min ago', read: false },
  { id: 'ALT-004', type: 'info', title: 'Invoice Generated', message: 'January 2025 invoice for Tesla Fleet — $5,592.00 has been generated.', time: '1 hr ago', read: true },
  { id: 'ALT-005', type: 'warning', title: 'Vehicle Disconnected', message: 'Audi e-tron (AUD-2345) cable disconnected at CHG-109 before session started.', time: '2 hrs ago', read: true },
  { id: 'ALT-006', type: 'fault', title: 'Communication Error', message: 'CHG-108 OCPP heartbeat timeout. Attempting reconnection...', time: '3 hrs ago', read: true },
  { id: 'ALT-007', type: 'success', title: 'Optimization Applied', message: 'Smart charging schedule updated for 12 vehicles. Estimated savings: 8.4%.', time: '4 hrs ago', read: true },
  { id: 'ALT-008', type: 'info', title: 'New Driver Registered', message: 'Elena Vasquez added to Green Wheels tenant. Access card activated.', time: '6 hrs ago', read: true },
]
