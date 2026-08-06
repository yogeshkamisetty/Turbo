export class BatteryModel {
  capacityKwh: number;
  currentSoc: number;
  targetSoc: number;
  maxChargeRateKw: number;
  totalEnergyDeliveredWh: number;

  constructor(
    capacityKwh: number = 80,
    initialSoc: number = 20,
    targetSoc: number = 90,
    maxChargeRateKw: number = 22
  ) {
    this.capacityKwh = capacityKwh;
    this.currentSoc = initialSoc;
    this.targetSoc = targetSoc;
    this.maxChargeRateKw = maxChargeRateKw;
    this.totalEnergyDeliveredWh = (initialSoc / 100) * capacityKwh * 1000;
  }

  /**
   * Calculates actual draw given allocated kW limit from charger pilot
   * Applies CC/CV battery taper curve above 80% SoC
   */
  calculateActualDraw(allocatedKw: number): number {
    if (this.currentSoc >= 100 || allocatedKw <= 0) return 0;

    let effectiveLimit = Math.min(allocatedKw, this.maxChargeRateKw);

    // Taper curve above 80% SoC
    if (this.currentSoc > 80) {
      const taperFactor = Math.max(0.1, 1.0 - (this.currentSoc - 80) / 22.2);
      effectiveLimit = effectiveLimit * taperFactor;
    }

    return effectiveLimit;
  }

  /**
   * Advances simulation step by deltaSeconds
   * Updates energy delivered and SoC
   */
  step(allocatedKw: number, deltaSeconds: number): { actualDrawKw: number; currentSoc: number; totalWh: number } {
    const actualDrawKw = this.calculateActualDraw(allocatedKw);
    const energyAddedWh = (actualDrawKw * deltaSeconds / 3600.0) * 1000.0;

    this.totalEnergyDeliveredWh += energyAddedWh;
    this.currentSoc = Math.min(100, (this.totalEnergyDeliveredWh / (this.capacityKwh * 1000.0)) * 100.0);

    return {
      actualDrawKw,
      currentSoc: parseFloat(this.currentSoc.toFixed(2)),
      totalWh: Math.floor(this.totalEnergyDeliveredWh)
    };
  }
}
