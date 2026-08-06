import React, { useState } from 'react';
import { Users, UserPlus, Shield, UserCheck, Search, Mail, Key, Check, X, Building2, Truck } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TENANT_MGR' | 'DRIVER';
  tenantName: string;
  assignedVehicle: string;
  rfidTag: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

interface UserManagementPanelProps {
  currentRole: 'ADMIN' | 'TENANT_MGR' | 'DRIVER';
}

export function UserManagementPanel({ currentRole }: UserManagementPanelProps) {
  const [usersList, setUsersList] = useState<UserItem[]>([
    {
      id: 'usr-001',
      name: 'System Admin',
      email: 'admin@switchyard.io',
      role: 'ADMIN',
      tenantName: 'System Global',
      assignedVehicle: 'Master Site Command',
      rfidTag: 'RFID-ADMIN-999',
      status: 'Active',
    },
    {
      id: 'usr-002',
      name: 'Alice Manager',
      email: 'fleet_mgr@logistics.com',
      role: 'TENANT_MGR',
      tenantName: 'Logistics Fleet A',
      assignedVehicle: '4 Active Fleet EVs',
      rfidTag: 'RFID-MGR-101',
      status: 'Active',
    },
    {
      id: 'usr-003',
      name: 'Driver Dave',
      email: 'driver1@logistics.com',
      role: 'DRIVER',
      tenantName: 'Logistics Fleet A',
      assignedVehicle: 'Van MH-12-AB-1001',
      rfidTag: 'RFID-DRV-001',
      status: 'Active',
    },
    {
      id: 'usr-004',
      name: 'Driver Alex',
      email: 'driver2@logistics.com',
      role: 'DRIVER',
      tenantName: 'Logistics Fleet A',
      assignedVehicle: 'Van MH-12-AB-1002',
      rfidTag: 'RFID-DRV-002',
      status: 'Active',
    },
    {
      id: 'usr-005',
      name: 'Driver Sam',
      email: 'driver4@logistics.com',
      role: 'DRIVER',
      tenantName: 'Logistics Fleet A',
      assignedVehicle: 'Truck MH-12-AB-1004',
      rfidTag: 'RFID-DRV-004',
      status: 'Active',
    },
    {
      id: 'usr-006',
      name: 'Bob Manager',
      email: 'delivery_mgr@express.com',
      role: 'TENANT_MGR',
      tenantName: 'Delivery Express B',
      assignedVehicle: '2 Active Fleet EVs',
      rfidTag: 'RFID-MGR-202',
      status: 'Active',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New User Form State
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<'TENANT_MGR' | 'DRIVER'>('DRIVER');
  const [newTenant, setNewTenant] = useState<string>('Logistics Fleet A');
  const [newVehicle, setNewVehicle] = useState<string>('Van MH-12-AB-1005');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filter users based on role and search query
  const filteredUsers = usersList.filter(u => {
    if (currentRole === 'TENANT_MGR' && u.tenantName !== 'Logistics Fleet A' && u.role !== 'ADMIN') {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.tenantName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUserItem: UserItem = {
      id: `usr-00${usersList.length + 1}`,
      name: newName,
      email: newEmail,
      role: newRole,
      tenantName: newTenant,
      assignedVehicle: newVehicle || 'Unassigned EV',
      rfidTag: `RFID-DRV-00${usersList.length + 1}`,
      status: 'Active',
    };

    setUsersList(prev => [...prev, newUserItem]);
    setSuccessMessage(`Successfully registered user ${newName} (${newEmail})!`);
    setNewName('');
    setNewEmail('');
    setTimeout(() => {
      setSuccessMessage('');
      setShowAddModal(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> User & Driver Directory Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Active user accounts, role-based claims, assigned EV assets & RFID access tags
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user or email..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">User Details</th>
              <th className="p-3">Role Claim</th>
              <th className="p-3">Tenant / Fleet</th>
              <th className="p-3">Assigned Vehicle</th>
              <th className="p-3">RFID Tag</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-900/50 transition">
                <td className="p-3 font-semibold text-white">
                  <div>{u.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === 'ADMIN'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : u.role === 'TENANT_MGR'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-300">{u.tenantName}</td>
                <td className="p-3 text-slate-300 font-mono text-[11px]">{u.assignedVehicle}</td>
                <td className="p-3 font-mono text-[11px] text-cyan-400">{u.rfidTag}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" /> Provision New User / Driver
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Driver Michael"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="michael@logistics.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Role Claim</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DRIVER">DRIVER</option>
                    <option value="TENANT_MGR">TENANT_MGR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Company / Tenant</label>
                  <select
                    value={newTenant}
                    onChange={(e) => setNewTenant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Logistics Fleet A">Logistics Fleet A</option>
                    <option value="Delivery Express B">Delivery Express B</option>
                    <option value="Green Transport C">Green Transport C</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Assigned EV Asset</label>
                <input
                  type="text"
                  value={newVehicle}
                  onChange={(e) => setNewVehicle(e.target.value)}
                  placeholder="e.g. Van MH-12-AB-1005"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Provision User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
