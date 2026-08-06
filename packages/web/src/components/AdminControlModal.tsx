import React, { useState } from 'react';
import { Plus, Edit2, Zap, Building2, ShieldCheck, DollarSign, Check, X, Server, AlertCircle, UserPlus, Mail } from 'lucide-react';

interface AdminControlModalProps {
  onClose: () => void;
  onUpdateSiteCap?: (newCap: number) => void;
  onAddCharger?: (charger: any) => void;
  onUpdateEntitlement?: (tenant: string, newFloor: number) => void;
  siteCapacityKw?: number;
  onUpdateCapacity?: (newCap: number) => void;
  role?: string;
  controlTier?: number;
  onUpdateTier?: (tier: number) => void;
}

export function AdminControlModal({
  onClose,
  onUpdateSiteCap,
  onAddCharger,
  onUpdateEntitlement
}: AdminControlModalProps) {
  const [activeTab, setActiveTab] = useState<'SITES' | 'CHARGERS' | 'ENTITLEMENTS' | 'INVITE_TENANT'>('SITES');

  // Form states
  const [siteName, setSiteName] = useState<string>('Metro Logistics Hub');
  const [siteCap, setSiteCap] = useState<number>(100);
  const [baseLoad, setBaseLoad] = useState<number>(5.0);

  const [newOcppId, setNewOcppId] = useState<string>('CP-009');
  const [newMaxKw, setNewMaxKw] = useState<number>(22.0);
  const [newCircuit, setNewCircuit] = useState<string>('Panel North (Feeder 1)');

  const [selectedTenant, setSelectedTenant] = useState<string>('Logistics Fleet A');
  const [newFloorKw, setNewFloorKw] = useState<number>(50.0);

  const [inviteCompanyName, setInviteCompanyName] = useState<string>('Urban Eco Cabs D');
  const [inviteManagerEmail, setInviteManagerEmail] = useState<string>('fleet@urbaneco.com');
  const [inviteInitialFloor, setInviteInitialFloor] = useState<number>(25.0);

  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteCap?.(siteCap);
    setSuccessMessage(`Site capacity updated to ${siteCap} kW successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateCharger = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCharger?.({
      ocppId: newOcppId,
      maxKw: newMaxKw,
      circuit: newCircuit,
      status: 'Available',
    });
    setSuccessMessage(`Charger ${newOcppId} (${newMaxKw} kW) added successfully!`);
    setNewOcppId(`CP-0${parseInt(newOcppId.slice(4) || '9', 10) + 1}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveEntitlement = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEntitlement?.(selectedTenant, newFloorKw);
    setSuccessMessage(`${selectedTenant} floor entitlement updated to ${newFloorKw} kW!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 max-w-xl w-full p-6 rounded-3xl shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Site Admin Management Center</h3>
              <p className="text-xs text-slate-400">Add sites, register chargers & modify company entitlement plans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SITES')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SITES' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Sites & Grid Cap
          </button>
          <button
            onClick={() => setActiveTab('CHARGERS')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'CHARGERS' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Add Charger
          </button>
          <button
            onClick={() => setActiveTab('ENTITLEMENTS')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ENTITLEMENTS' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Company Plans
          </button>
          <button
            onClick={() => setActiveTab('INVITE_TENANT')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'INVITE_TENANT' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite Tenant
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form 1: Sites & Grid Capacity */}
        {activeTab === 'SITES' && (
          <form onSubmit={handleSaveSite} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Contracted Site Transformer Limit (kW)</label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={siteCap}
                  onChange={(e) => setSiteCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Facility Base Load (kW)</label>
                <input
                  type="number"
                  step="0.5"
                  value={baseLoad}
                  onChange={(e) => setBaseLoad(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20"
            >
              Update Site Transformer Capacity
            </button>
          </form>
        )}

        {/* Form 2: Register New Charger */}
        {activeTab === 'CHARGERS' && (
          <form onSubmit={handleCreateCharger} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">OCPP Identifier (ocpp_id)</label>
                <input
                  type="text"
                  required
                  value={newOcppId}
                  onChange={(e) => setNewOcppId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Max Rating (kW)</label>
                <input
                  type="number"
                  value={newMaxKw}
                  onChange={(e) => setNewMaxKw(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Circuit / Panel Sub-Feeder</label>
              <select
                value={newCircuit}
                onChange={(e) => setNewCircuit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Panel North (Feeder 1)">Panel North (Feeder 1 - 60 kW Cap)</option>
                <option value="Panel South (Feeder 2)">Panel South (Feeder 2 - 60 kW Cap)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Register New OCPP Charger
            </button>
          </form>
        )}

        {/* Form 3: Modify Company Entitlement Plans */}
        {activeTab === 'ENTITLEMENTS' && (
          <form onSubmit={handleSaveEntitlement} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Select Company / Fleet Tenant</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Logistics Fleet A">Logistics Fleet A (Current: 40 kW Floor)</option>
                <option value="Delivery Express B">Delivery Express B (Current: 30 kW Floor)</option>
                <option value="Green Transport C">Green Transport C (Current: 20 kW Floor)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">New Guaranteed Contract Floor (kW)</label>
              <input
                type="number"
                step="5"
                value={newFloorKw}
                onChange={(e) => setNewFloorKw(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20"
            >
              Save Company Entitlement Floor
            </button>
          </form>
        )}

        {/* Form 4: Invite Tenant Company */}
        {activeTab === 'INVITE_TENANT' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateEntitlement(inviteCompanyName, inviteInitialFloor);
              setSuccessMessage(`Invitation sent to ${inviteManagerEmail} for ${inviteCompanyName} (${inviteInitialFloor} kW floor)!`);
              setTimeout(() => setSuccessMessage(''), 3500);
            }}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Company / Tenant Name</label>
              <input
                type="text"
                required
                value={inviteCompanyName}
                onChange={(e) => setInviteCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Urban Eco Cabs D"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Fleet Manager Email</label>
                <input
                  type="email"
                  required
                  value={inviteManagerEmail}
                  onChange={(e) => setInviteManagerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="manager@domain.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Initial Floor (kW)</label>
                <input
                  type="number"
                  value={inviteInitialFloor}
                  onChange={(e) => setInviteInitialFloor(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Send Tenant Invite & Provision RLS Floor
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
