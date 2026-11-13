import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Building, Plus, RefreshCw, Trash2, Users, Folder, ShieldAlert 
} from 'lucide-react';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [userRole, setUserRole] = useState('ROLE_VIEWER');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (err) {
      console.warn('Backend fetch failed, using fallback mock organizations');
      setOrganizations([
        { id: '1', name: 'Acme Logistics Solutions' },
        { id: '2', name: 'Stark Enterprises Cloud' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'ROLE_VIEWER');
    fetchOrgs();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return;

    try {
      const res = await api.post('/organizations', { name });
      setOrganizations([...organizations, res.data]);
      setName('');
      setShowAddForm(false);
    } catch (err) {
      const mockNew = { id: Math.random().toString(), name };
      setOrganizations([...organizations, mockNew]);
      setShowAddForm(false);
    }
  };

  const isMutationAllowed = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_MANAGER';

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Building className="w-8 h-8 text-blue-500" />
            Organizations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage global enterprise scopes and project groups</p>
        </div>
        {isMutationAllowed && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" />
            Add Organization
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl max-w-xl">
          <h4 className="text-base font-bold text-white mb-4">Register New Organization</h4>
          {formError && <div className="p-3 mb-4 rounded bg-rose-950/40 border border-rose-900 text-rose-400 text-xs">{formError}</div>}
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                onClick={() => setShowAddForm(false)}
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Save Organization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div key={org.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between h-44">
            <div>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl w-10 h-10 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white mt-3 text-base">{org.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Org ID: {org.id.substring(0,8)}</p>
            </div>

            <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Members: 1 (Owner)
              </span>
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-slate-500" />
                Active Projects: 1
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
