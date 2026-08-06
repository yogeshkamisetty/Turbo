import { v4 as uuidv4 } from 'uuid';
import { ActiveConnection, OcppMessageType } from './types';

export interface ProfileOptions {
  connectorId: number;
  allocatedKw: number;
  durationSeconds?: number;
  purpose?: 'TxProfile' | 'TxDefaultProfile';
  transactionId?: number;
}

export function sendSetChargingProfile(
  conn: ActiveConnection,
  options: ProfileOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!conn.ws || conn.ws.readyState !== 1) {
      resolve(false);
      return;
    }

    const messageId = uuidv4();
    const duration = options.durationSeconds || 120; // 2x optimizer cycle
    const limitWatts = Math.max(0, Math.floor(options.allocatedKw * 1000));
    const purpose = options.purpose || 'TxProfile';

    const payload = {
      connectorId: options.connectorId,
      csChargingProfiles: {
        chargingProfileId: Math.floor(Math.random() * 10000) + 1,
        stackLevel: purpose === 'TxProfile' ? 1 : 0,
        chargingProfilePurpose: purpose,
        chargingProfileKind: 'Relative',
        ...(options.transactionId ? { transactionId: options.transactionId } : {}),
        chargingSchedule: {
          duration: duration,
          chargingRateUnit: 'W',
          chargingSchedulePeriod: [
            {
              startPeriod: 0,
              limit: limitWatts,
              numberPhases: 3
            }
          ]
        }
      }
    };

    const callMessage = [
      OcppMessageType.CALL,
      messageId,
      'SetChargingProfile',
      payload
    ];

    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000);

    const onMessage = (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (Array.isArray(parsed) && parsed[0] === OcppMessageType.CALL_RESULT && parsed[1] === messageId) {
          clearTimeout(timeout);
          conn.ws.off('message', onMessage);
          resolve(parsed[2]?.status === 'Accepted');
        }
      } catch (e) {
        // ignore parse error for unrelated message
      }
    };

    conn.ws.on('message', onMessage);
    conn.ws.send(JSON.stringify(callMessage));
  });
}
