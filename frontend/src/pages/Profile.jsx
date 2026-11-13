import React, { useEffect, useState } from 'react';
import { 
  User, Shield, ShieldCheck, Check, X, Key 
} from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState({ username: 'User', role: 'ROLE_VIEWER' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
      setProfile(user);
    }
  }, []);

  const permissionGrid = [
    { action: 'View Metrics & Dashboards', admin: true, manager: true, developer: true, viewer: true },
    { action: 'Browse Job Logs & Executions', admin: true, manager: true, developer: true, viewer: true },
    { action: 'Submit/Enqueue New Jobs', admin: true, manager: true, developer: true, viewer: false },
    { action: 'Manual Retry failed tasks', admin: true, manager: true, developer: true, viewer: false },
    { action: 'Create/Edit Retry Policies', admin: true, manager: true, developer: false, viewer: false },
    { action: 'Pause/Resume Queues & Throttles', admin: true, manager: true, developer: false, viewer: false },
    { action: 'Delete Queues & System purging', admin: true, manager: false, developer: false, viewer: false }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'bg-rose-950/60 text-rose-400 border border-rose-900/35';
      case 'ROLE_MANAGER': return 'bg-amber-950/60 text-amber-400 border border-amber-900/35';
      case 'ROLE_DEVELOPER': return 'bg-blue-950/60 text-blue-400 border border-blue-900/35';
      default: return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
  };

  const cleanRoleName = (role) => {
    if (!role) return 'Viewer';
    return role.replace('ROLE_', '');
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <User className="w-8 h-8 text-blue-500" />
          My Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage credentials and audit access clearance levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center space-y-4 self-start">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-extrabold text-2xl border-2 border-blue-500/20">
            {profile.username?.substring(0,2).toUpperCase()}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">{profile.username}</h3>
            <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider mt-1.5 uppercase ${getRoleBadgeColor(profile.role)}`}>
              {cleanRoleName(profile.role)}
            </span>
          </div>
        </div>

        {/* Security / RBAC Matrix */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Security Clearance Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest font-bold">
                  <th className="py-2.5">Capabilities</th>
                  <th className="py-2.5 text-center">Admin</th>
                  <th className="py-2.5 text-center">Manager</th>
                  <th className="py-2.5 text-center">Dev</th>
                  <th className="py-2.5 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {permissionGrid.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/20">
                    <td className="py-3 font-medium text-slate-200">{p.action}</td>
                    <td className="py-3 text-center">
                      {p.admin ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-rose-500 mx-auto" />}
                    </td>
                    <td className="py-3 text-center">
                      {p.manager ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-rose-500 mx-auto" />}
                    </td>
                    <td className="py-3 text-center">
                      {p.developer ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-rose-500 mx-auto" />}
                    </td>
                    <td className="py-3 text-center">
                      {p.viewer ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-rose-500 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
