export enum OcppMessageType {
  CALL = 2,
  CALL_RESULT = 3,
  CALL_ERROR = 4
}

export type OcppCallMessage = [OcppMessageType.CALL, string, string, Record<string, any>];
export type OcppCallResultMessage = [OcppMessageType.CALL_RESULT, string, Record<string, any>];
export type OcppCallErrorMessage = [OcppMessageType.CALL_ERROR, string, string, string, Record<string, any>];

export interface SetProfileOptions {
  connectorId: number;
  allocatedKw: number;
  durationSeconds?: number;
  purpose?: 'TxProfile' | 'TxDefaultProfile';
  transactionId?: number;
  numberPhases?: number;
}

export interface ActiveConnection {
  ocppId: string;
  chargerDbId?: string;
  ws: any;
  connectedAt: Date;
  lastHeartbeat: Date;
  transactionId?: number;
  currentSessionId?: string;
}
