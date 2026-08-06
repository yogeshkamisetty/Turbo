import WebSocket from 'ws';
import { BatteryModel } from './battery-model';

export class ChargerSimulator {
  ocppId: string;
  gatewayUrl: string;
  vehicleTag: string;
  battery: BatteryModel;
  ws?: WebSocket;
  allocatedKw: number = 0;
  transactionId?: number;
  meterInterval?: NodeJS.Timeout;
  heartbeatInterval?: NodeJS.Timeout;

  constructor(
    ocppId: string,
    gatewayUrl: string,
    vehicleTag: string,
    battery: BatteryModel
  ) {
    this.ocppId = ocppId;
    this.gatewayUrl = gatewayUrl;
    this.vehicleTag = vehicleTag;
    this.battery = battery;
  }

  connect() {
    const wsUrl = `${this.gatewayUrl}/ocpp/${this.ocppId}`;
    console.log(`[Simulator ${this.ocppId}] Connecting to ${wsUrl}...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log(`[Simulator ${this.ocppId}] Connected`);
      this.sendBootNotification();

      // Start Heartbeat every 60s
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 60000);

      // Plug in vehicle after 2 seconds
      setTimeout(() => {
        this.plugInAndStart();
      }, 2000);
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!Array.isArray(msg)) return;

        // Received CALL from Gateway (e.g. SetChargingProfile)
        if (msg[0] === 2) {
          const [, messageId, action, payload] = msg;
          if (action === 'SetChargingProfile') {
            const limitWatts = payload.csChargingProfiles?.chargingSchedule?.chargingSchedulePeriod?.[0]?.limit || 0;
            this.allocatedKw = limitWatts / 1000.0;
            console.log(`[Simulator ${this.ocppId}] Received SetChargingProfile: ${this.allocatedKw} kW`);

            // Respond Accepted
            this.ws?.send(JSON.stringify([3, messageId, { status: 'Accepted' }]));
          }
        } else if (msg[0] === 3) {
          // CALL_RESULT from Gateway
          if (msg[2]?.transactionId) {
            this.transactionId = msg[2].transactionId;
            console.log(`[Simulator ${this.ocppId}] Transaction started ID: ${this.transactionId}`);
            this.startMeterValuesLoop();
          }
        }
      } catch (err) {
        console.error(`[Simulator ${this.ocppId}] Error parsing message:`, err);
      }
    });

    this.ws.on('close', () => {
      console.log(`[Simulator ${this.ocppId}] Connection closed. Reconnecting in 5s...`);
      this.cleanup();
      setTimeout(() => this.connect(), 5000);
    });
  }

  sendBootNotification() {
    const msg = [
      2,
      `boot_${Date.now()}`,
      'BootNotification',
      {
        chargePointVendor: 'SwitchyardSim',
        chargePointModel: 'SY-22KW',
        firmwareVersion: '1.0.0'
      }
    ];
    this.ws?.send(JSON.stringify(msg));
  }

  sendHeartbeat() {
    const msg = [2, `hb_${Date.now()}`, 'Heartbeat', {}];
    this.ws?.send(JSON.stringify(msg));
  }

  plugInAndStart() {
    // Send StatusNotification Preparing
    this.ws?.send(JSON.stringify([
      2,
      `status_${Date.now()}`,
      'StatusNotification',
      { connectorId: 1, errorCode: 'NoError', status: 'Preparing' }
    ]));

    // Authorize & StartTransaction
    setTimeout(() => {
      this.ws?.send(JSON.stringify([
        2,
        `auth_${Date.now()}`,
        'Authorize',
        { idTag: this.vehicleTag }
      ]));

      this.ws?.send(JSON.stringify([
        2,
        `start_${Date.now()}`,
        'StartTransaction',
        { connectorId: 1, idTag: this.vehicleTag, meterStart: 0, timestamp: new Date().toISOString() }
      ]));
    }, 1000);
  }

  startMeterValuesLoop() {
    if (this.meterInterval) clearInterval(this.meterInterval);

    this.meterInterval = setInterval(() => {
      const stepResult = this.battery.step(this.allocatedKw, 5); // 5-second step

      const msg = [
        2,
        `mv_${Date.now()}`,
        'MeterValues',
        {
          connectorId: 1,
          transactionId: this.transactionId,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [
                { value: (stepResult.actualDrawKw * 1000).toString(), unit: 'W', measurand: 'Power.Active.Import' },
                { value: stepResult.currentSoc.toString(), unit: 'Percent', measurand: 'SoC' },
                { value: stepResult.totalWh.toString(), unit: 'Wh', measurand: 'Energy.Active.Import.Register' }
              ]
            }
          ]
        }
      ];

      this.ws?.send(JSON.stringify(msg));
    }, 5000);
  }

  cleanup() {
    if (this.meterInterval) clearInterval(this.meterInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
}
