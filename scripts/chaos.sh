#!/bin/bash
# Switchyard Section 7 Chaos Switch Demo Script

case "$1" in
  kill-optimizer)
    echo "⚡ Killing Optimizer Service (Simulating Cloud Outage / Timeout)..."
    docker kill switchyard-optimizer
    echo "✓ Tier-1 Gateway-local greedy fallback activated."
    ;;
  kill-gateway)
    echo "⚡ Killing Gateway Service (Simulating total network partition)..."
    docker kill switchyard-gateway
    echo "✓ Tier-0 Charger-resident TxDefaultProfile enforcing offline safety floor."
    ;;
  recover)
    echo "🔄 Recovering services..."
    docker start switchyard-optimizer switchyard-gateway
    echo "✓ System recovered to Tier-2 Cloud MILP state."
    ;;
  *)
    echo "Usage: $0 {kill-optimizer|kill-gateway|recover}"
    exit 1
    ;;
esac
