import { sendSetChargingProfile } from './profile-sender';
import { ActiveConnection } from './types';

export interface CachedSession {
  sessionId: string;
  tenantId: string;
  ocppId: string;
  connectorIndex: number;
  maxKw: number;
  minKw: number;
  tierWeight: number;
  transactionId?: number;
}

export class GatewayStateCache {
  siteCapKw: number = 100.0;
  activeSessions: Map<string, CachedSession> = new Map();

  updateSession(session: CachedSession) {
    this.activeSessions.set(session.sessionId, session);
  }

  removeSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }
}

export const gatewayCache = new GatewayStateCache();

/**
 * Tier-1 Fallback Allocator (Gateway-Local Greedy Water-Filling)
 * NO DATABASE DEPENDENCY — Runs 100% in-memory in ~1ms inside the gateway process.
 */
export async function runTier1GreedyAllocation(connections: Map<string, ActiveConnection>) {
  console.log('[Tier-1 Gateway Fallback] Executing zero-DB-dependency greedy water-filling allocator...');

  const sessions = Array.from(gatewayCache.activeSessions.values());
  if (sessions.length === 0) return;

  let remainingCapacity = gatewayCache.siteCapKw;
  const allocations: Map<string, number> = new Map();

  // First pass: allocate min charge rate (1.38 kW or 4.14 kW) OR 0 if scraps remain below 6A floor
  for (const sess of sessions) {
    const minKw = sess.minKw || 4.14;
    const maxKw = sess.maxKw || 22.0;

    if (remainingCapacity >= minKw) {
      const alloc = Math.min(minKw, maxKw, remainingCapacity);
      allocations.set(sess.sessionId, alloc);
      remainingCapacity -= alloc;
    } else {
      // Correct disjunction: zero out if scraps are below 6A IEC floor
      allocations.set(sess.sessionId, 0.0);
    }
  }

  // Second pass: distribute remaining capacity proportionally by weight
  if (remainingCapacity > 0) {
    const totalWeight = sessions.reduce((sum, s) => sum + (s.tierWeight || 1.0), 0);
    for (const sess of sessions) {
      const weight = sess.tierWeight || 1.0;
      const currentAlloc = allocations.get(sess.sessionId) || 0;

      if (currentAlloc >= sess.minKw) {
        const extraShare = (weight / max(0.1, totalWeight)) * remainingCapacity;
        const finalAlloc = Math.min(sess.maxKw, currentAlloc + extraShare);
        allocations.set(sess.sessionId, finalAlloc);
      }
    }
  }

  // Dispatch profile to connected chargers over sockets
  for (const sess of sessions) {
    const kw = allocations.get(sess.sessionId) || 0.0;
    const conn = connections.get(sess.ocppId);

    if (conn) {
      await sendSetChargingProfile(conn, {
        connectorId: sess.connectorIndex,
        allocatedKw: kw,
        durationSeconds: 120, // 2-min expiration safely falls back to Tier 0 if gateway dies
        purpose: 'TxProfile',
        transactionId: sess.transactionId || conn.transactionId
      });
    }
  }
}

function max(a: number, b: number): number {
  return a > b ? a : b;
}
