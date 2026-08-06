import { dbPool, redisPublisher } from '../db';
import { ActiveConnection, OcppMessageType } from '../types';

let txCounter = Math.floor(Math.random() * 10000) + 100;

export async function handleStartTransaction(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const { connectorId, idTag, timestamp, meterStart } = payload;
  const transactionId = ++txCounter;
  conn.transactionId = transactionId;

  // Find vehicle associated with idTag or select first vehicle of tenant
  const vehicleRes = await dbPool.query(
    `SELECT v.id, v.tenant_id FROM vehicles v WHERE v.license_plate = $1 OR v.id::text = $1 LIMIT 1`,
    [idTag]
  );

  let tenantId = '11111111-1111-1111-1111-111111111111'; // Default Tenant A if unknown
  let vehicleId = null;

  if (vehicleRes.rows.length > 0) {
    tenantId = vehicleRes.rows[0].tenant_id;
    vehicleId = vehicleRes.rows[0].id;
  }

  // Create active session in DB
  const sessionRes = await dbPool.query(
    `INSERT INTO sessions 
      (tenant_id, vehicle_id, charger_id, connector_index, start_time, departure_time, start_soc, current_soc, target_soc, state)
     VALUES 
      ($1, $2, (SELECT id FROM chargers WHERE ocpp_id = $3 LIMIT 1), $4, NOW(), NOW() + INTERVAL '4 hours', 20.0, 20.0, 90.0, 'PluggedIn')
     RETURNING id`,
    [tenantId, vehicleId, conn.ocppId, connectorId || 1]
  );

  const sessionId = sessionRes.rows[0].id;
  conn.currentSessionId = sessionId;

  // Add to in-memory gateway cache for zero-DB Tier-1 greedy fallback
  const { gatewayCache } = require('../tier1-greedy');
  gatewayCache.updateSession({
    sessionId,
    tenantId,
    ocppId: conn.ocppId,
    connectorIndex: connectorId || 1,
    maxKw: 22.0,
    minKw: 4.14,
    tierWeight: 1.0,
    transactionId
  });

  // Create Initial Charge Promise (D3)
  await dbPool.query(
    `INSERT INTO charge_promises (session_id, tenant_id, promised_soc, promised_by, confidence, state)
     VALUES ($1, $2, 90.0, NOW() + INTERVAL '4 hours', 'HIGH', 'ACTIVE')`,
    [sessionId, tenantId]
  );

  await redisPublisher.publish('session:event', JSON.stringify({
    type: 'START_TRANSACTION',
    sessionId,
    ocppId: conn.ocppId,
    tenantId,
    timestamp: new Date().toISOString()
  }));

  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {
      transactionId,
      idTagInfo: { status: 'Accepted' }
    }
  ];
  conn.ws.send(JSON.stringify(response));
}

export async function handleStopTransaction(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const { transactionId, meterStop, timestamp, reason } = payload;

  if (conn.currentSessionId) {
    await dbPool.query(
      `UPDATE sessions SET end_time = NOW(), state = 'Completed' WHERE id = $1`,
      [conn.currentSessionId]
    );

    await redisPublisher.publish('session:event', JSON.stringify({
      type: 'STOP_TRANSACTION',
      sessionId: conn.currentSessionId,
      ocppId: conn.ocppId,
      timestamp: new Date().toISOString()
    }));

    conn.currentSessionId = undefined;
    conn.transactionId = undefined;
  }

  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    { idTagInfo: { status: 'Accepted' } }
  ];
  conn.ws.send(JSON.stringify(response));
}
