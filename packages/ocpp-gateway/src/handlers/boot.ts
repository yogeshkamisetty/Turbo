import { dbPool, redisPublisher } from '../db';
import { sendSetChargingProfile } from '../profile-sender';
import { ActiveConnection, OcppMessageType } from '../types';

export async function handleBootNotification(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const { chargePointVendor, chargePointModel } = payload;
  console.log(`[OCPP Gateway] BootNotification from ${conn.ocppId} (${chargePointVendor} ${chargePointModel})`);

  // 1. Update charger record in DB or register if new
  const res = await dbPool.query(
    `INSERT INTO chargers (ocpp_id, vendor, model, site_id, status)
     VALUES ($1, $2, $3, (SELECT id FROM sites LIMIT 1), 'Available')
     ON CONFLICT (ocpp_id) DO UPDATE SET vendor = EXCLUDED.vendor, model = EXCLUDED.model, status = 'Available'
     RETURNING id, site_id`,
    [conn.ocppId, chargePointVendor || 'Switchyard', chargePointModel || 'SY-22KW']
  );

  if (res.rows.length > 0) {
    conn.chargerDbId = res.rows[0].id;
  }

  // 2. Publish charger online event to Redis
  await redisPublisher.publish('charger:status', JSON.stringify({
    ocppId: conn.ocppId,
    status: 'Available',
    timestamp: new Date().toISOString()
  }));

  // 3. Respond with Accepted
  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 300
    }
  ];
  conn.ws.send(JSON.stringify(response));

  // 4. Install Tier-0 TxDefaultProfile (Offline safety ceiling: C_site / 8 chargers = 12.5 kW)
  setTimeout(() => {
    sendSetChargingProfile(conn, {
      connectorId: 0,
      allocatedKw: 12.5,
      durationSeconds: 86400, // 24 hours fallback
      purpose: 'TxDefaultProfile'
    });
  }, 1000);
}
