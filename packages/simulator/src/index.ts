import dotenv from 'dotenv';
dotenv.config();

import { ChargerSimulator } from './charger';
import { BatteryModel } from './battery-model';

const gatewayUrl = process.env.GATEWAY_URL || 'ws://localhost:9000';
const count = parseInt(process.env.CHARGER_COUNT || '8', 10);

console.log(`[Simulator Cluster] Initializing ${count} chargers...`);

const vehicleTags = [
  'MH-12-AB-1001', 'MH-12-AB-1002', 'MH-12-AB-1003', 'MH-12-AB-1004',
  'MH-14-XY-2001', 'MH-14-XY-2002', 'MH-14-XY-2003', 'MH-14-XY-2004',
  'MH-01-TZ-3001', 'MH-01-TZ-3002', 'MH-01-TZ-3003', 'MH-01-TZ-3004'
];

const chargers: ChargerSimulator[] = [];

for (let i = 1; i <= count; i++) {
  const ocppId = `CP-00${i}`;
  const tag = vehicleTags[(i - 1) % vehicleTags.length];
  const initialSoc = 15 + (i * 7) % 40; // 15% to 55% SoC
  const battery = new BatteryModel(80, initialSoc, 90, 22);

  const charger = new ChargerSimulator(ocppId, gatewayUrl, tag, battery);
  chargers.push(charger);

  // Stagger vehicle arrivals by 4000ms for progressive plug-in demo
  setTimeout(() => {
    charger.connect();
  }, (i - 1) * 4000);
}
