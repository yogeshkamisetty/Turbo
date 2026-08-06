import { dbPool, redisPublisher } from '../db';
import { ActiveConnection, OcppMessageType } from '../types';

export async function handleMeterValues(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const { connectorId, transactionId, meterValue } = payload;

  let measuredKw = 0;
  let currentSoc = null;
  let energyWh = 0;

  if (Array.isArray(meterValue)) {
    for (const sample of meterValue) {
      if (Array.isArray(sample.sampledValue)) {
        for (const val of sample.sampledValue) {
          const meas = val.measurand || 'Energy.Active.Import.Register';
          const numVal = parseFloat(val.value);

          if (meas === 'Power.Active.Import') {
            const unit = val.unit || 'W';
            measuredKw = unit === 'kW' ? numVal : numVal / 1000.0;
          } else if (meas === 'SoC') {
            currentSoc = numVal;
          } else if (meas === 'Energy.Active.Import.Register') {
            energyWh = numVal;
          }
        }
      }
    }
  }

  if (conn.currentSessionId) {
    const updates: string[] = ['measured_kw = $1'];
    const params: any[] = [measuredKw];

    if (currentSoc !== null) {
      params.push(currentSoc);
      updates.push(`current_soc = $${params.length}`);
    }

    if (energyWh > 0) {
      params.push(energyWh / 1000.0);
      updates.push(`delivered_kwh = $${params.length}`);
    }

    params.push(conn.currentSessionId);
    await dbPool.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );

    await redisPublisher.publish('meter:update', JSON.stringify({
      sessionId: conn.currentSessionId,
      ocppId: conn.ocppId,
      measuredKw,
      currentSoc,
      deliveredKwh: energyWh / 1000.0,
      timestamp: new Date().toISOString()
    }));
  }

  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {}
  ];
  conn.ws.send(JSON.stringify(response));
}
