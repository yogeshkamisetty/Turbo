import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { dbPool, redisSubscriber } from './db';
import { handleBootNotification } from './handlers/boot';
import { handleHeartbeat, handleAuthorize } from './handlers/basic';
import { handleStatusNotification } from './handlers/status';
import { handleStartTransaction, handleStopTransaction } from './handlers/transaction';
import { handleMeterValues } from './handlers/meter-values';
import { sendSetChargingProfile } from './profile-sender';
import { runTier1GreedyAllocation } from './tier1-greedy';
import { ActiveConnection, OcppMessageType } from './types';

export const activeConnections: Map<string, ActiveConnection> = new Map();

export function createOcppServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Switchyard OCPP Gateway Running\n');
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const url = req.url || '';
    const parts = url.split('/');
    const ocppId = parts[parts.length - 1] || 'UNKNOWN_CP';

    console.log(`[OCPP Gateway] Charger connected: ${ocppId} from ${req.socket.remoteAddress}`);

    const conn: ActiveConnection = {
      ocppId,
      ws,
      connectedAt: new Date(),
      lastHeartbeat: new Date()
    };
    activeConnections.set(ocppId, conn);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (!Array.isArray(message)) return;

        const messageType = message[0];

        if (messageType === OcppMessageType.CALL) {
          const [, messageId, action, payload] = message;

          switch (action) {
            case 'BootNotification':
              await handleBootNotification(conn, messageId, payload);
              break;
            case 'Heartbeat':
              await handleHeartbeat(conn, messageId);
              break;
            case 'Authorize':
              await handleAuthorize(conn, messageId, payload);
              break;
            case 'StatusNotification':
              await handleStatusNotification(conn, messageId, payload);
              break;
            case 'StartTransaction':
              await handleStartTransaction(conn, messageId, payload);
              break;
            case 'StopTransaction':
              await handleStopTransaction(conn, messageId, payload);
              break;
            case 'MeterValues':
              await handleMeterValues(conn, messageId, payload);
              break;
            default:
              // Respond with empty result for unsupported call
              ws.send(JSON.stringify([OcppMessageType.CALL_RESULT, messageId, {}]));
          }
        }
      } catch (err) {
        console.error(`[OCPP Gateway] Error processing message from ${ocppId}:`, err);
      }
    });

    ws.on('close', async () => {
      console.log(`[OCPP Gateway] Charger disconnected: ${ocppId}`);
      activeConnections.delete(ocppId);
      if (conn.chargerDbId) {
        await dbPool.query("UPDATE chargers SET status = 'Offline' WHERE id = $1", [conn.chargerDbId]);
      }
    });
  });

  let lastAllocationTimestamp = Date.now();

  // Gateway-Resident Watchdog Timer: Runs every 15s to check if API container died
  setInterval(() => {
    const elapsed = Date.now() - lastAllocationTimestamp;
    if (elapsed > 90000 && activeConnections.size > 0) {
      console.warn(`[OCPP Gateway Watchdog] No allocation received for ${Math.round(elapsed / 1000)}s! Executing Tier-1 in-memory greedy fallback locally...`);
      runTier1GreedyAllocation(activeConnections);
    }
  }, 15000);

  // Subscribe to Redis for allocation & fallback commands from API/Optimizer
  redisSubscriber.subscribe('allocation:dispatch');
  redisSubscriber.subscribe('optimizer:fallback');

  redisSubscriber.on('message', async (channel, message) => {
    if (channel === 'allocation:dispatch') {
      try {
        lastAllocationTimestamp = Date.now(); // Refresh watchdog heartbeat!
        const data = JSON.parse(message);
        const conn = activeConnections.get(data.ocppId);
        if (conn) {
          await sendSetChargingProfile(conn, {
            connectorId: data.connectorId || 1,
            allocatedKw: data.allocatedKw,
            durationSeconds: 120,
            purpose: 'TxProfile',
            transactionId: data.transactionId || conn.transactionId
          });
        }
      } catch (err) {
        console.error('[OCPP Gateway] Error handling allocation dispatch:', err);
      }
    } else if (channel === 'optimizer:fallback') {
      console.warn('[OCPP Gateway] Received optimizer:fallback trigger! Invoking Tier-1 local greedy allocator...');
      await runTier1GreedyAllocation(activeConnections);
    }
  });

  server.listen(port, () => {
    console.log(`[OCPP Gateway] Server listening on port ${port}`);
  });

  return server;
}
