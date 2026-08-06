#!/bin/bash
# Switchyard Section 10 Demo Rehearsal Script (Plan v2 6-Beat Demo)

echo "================================================================="
echo "🎬 Switchyard 4-Minute Demo Beat Rehearsal"
echo "================================================================="

echo "Beat 1: Fill the site — 5 vehicles plug in, site power climbs to 100 kW red line."
echo "Beat 2: The pause — 3 more plug in, solver pauses 2 vehicles to enforce 6A floor."
echo "Beat 3: 'Why am I at 7 kW?' — Click session receipt, GLOP shadow price ₹18.50/kW displayed."
echo "Beat 4: Deadline conflict — 20-min departure change, silent borrowing restores promise."
echo "Beat 5: Chaos — kill optimizer -> Tier 1 greedy fallback -> kill gateway -> Tier 0 default profile."
echo "Beat 6: The number — Cut to Caltech ACN-Data benchmark chart (22.4% peak demand reduction)."

echo "================================================================="
echo "To execute Beat 5 Chaos demo:"
echo "  ./scripts/chaos.sh kill-optimizer"
echo "  ./scripts/chaos.sh kill-gateway"
echo "  ./scripts/chaos.sh recover"
echo "================================================================="
