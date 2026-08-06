import { dbPool, redisPublisher } from '../db';
import { ActiveConnection, OcppMessageType } from '../types';

export async function handleStatusNotification(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const { connectorId, status, errorCode } = payload;

  if (conn.chargerDbId) {
    await dbPool.query(
      `UPDATE connectors SET status = $1 WHERE charger_id = $2 AND connector_index = $3`,
      [status, conn.chargerDbId, connectorId || 1]
    );

    await dbPool.query(
      `UPDATE chargers SET status = $1 WHERE id = $2`,
      [status, conn.chargerDbId]
    );
  }

  await redisPublisher.publish('charger:status', JSON.stringify({
    ocppId: conn.ocppId,
    connectorId: connectorId || 1,
    status,
    errorCode: errorCode || 'NoError',
    timestamp: new Date().toISOString()
  }));

  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {}
  ];
  conn.ws.send(JSON.stringify(response));
}
