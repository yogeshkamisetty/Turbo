import { ActiveConnection, OcppMessageType } from '../types';

export async function handleHeartbeat(
  conn: ActiveConnection,
  messageId: string
) {
  conn.lastHeartbeat = new Date();
  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {
      currentTime: new Date().toISOString()
    }
  ];
  conn.ws.send(JSON.stringify(response));
}

export async function handleAuthorize(
  conn: ActiveConnection,
  messageId: string,
  payload: Record<string, any>
) {
  const response = [
    OcppMessageType.CALL_RESULT,
    messageId,
    {
      idTagInfo: {
        status: 'Accepted'
      }
    }
  ];
  conn.ws.send(JSON.stringify(response));
}
