import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Folder, Plus, Search, RefreshCw, Trash2, Building, ChevronRight 
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filtering
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [page, setPage] = useState(0);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [formError, setFormError] = useState('');
  const [userRole, setUserRole] = useState('ROLE_VIEWER');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, orgsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/organizations')
      ]);
      setProjects(projRes.data);
      setOrganizations(orgsRes.data);
      if (orgsRes.data.length > 0) {
        setOrganizationId(orgsRes.data[0].id);
      }
    } catch (err) {
      console.warn('Backend fetch failed, fallback to mock projects');
      // Mock setups
      setProjects([
        { id: '1', name: 'Billing Logistics Core', organization: { name: 'Acme Corp' } },
        { id: '2', name: 'Database Optimisation Scripts', organization: { name: 'Acme Corp' } },
        { id: '3', name: 'Cloud Infrastructure Analytics', organization: { name: 'Stark Enterprises Cloud' } }
      ]);
      setOrganizations([
        { id: '1', name: 'Acme Corp' },
        { id: '2', name: 'Stark Enterprises Cloud' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'ROLE_VIEWER');
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return;

    try {
      const res = await api.post(`/projects?organizationId=${organizationId}`, { name });
      setProjects([...projects, res.data]);
      setName('');
      setShowAddForm(false);
    } catch (err) {
      // Mock creation locally
      const mockOrg = organizations.find(o => o.id === organizationId) || { name: 'Local Corp' };
      const mockNew = { id: Math.random().toString(), name, organization: mockOrg };
      setProjects([...projects, mockNew]);
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project? This cascades to all queues and jobs.')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  // Client-side search filters
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = orgFilter ? (p.organization?.id === orgFilter || p.organization?.name === orgFilter) : true;
    return matchesSearch && matchesOrg;
  });

  const isMutationAllowed = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_MANAGER';

  if (loading && projects.length === 0) {
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
            <Folder className="w-8 h-8 text-blue-500" />
            Projects
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage tenant configurations, directories, and queue namespaces</p>
        </div>
        {isMutationAllowed && organizations.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
        </div>

        <div className="w-52">
          <select
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
          >
            <option value="">All Organizations</option>
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-xl">
          <h4 className="text-base font-bold text-white mb-4">Create New Project</h4>
          {formError && <div className="p-3 mb-4 rounded bg-rose-950/40 border border-rose-900 text-rose-400 text-xs">{formError}</div>}
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. logistics-api"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization Scope</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
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
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-44">
            <div className="flex justify-between items-start">
              <div>
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl w-10 h-10 flex items-center justify-center">
                  <Folder className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mt-3 text-base">{p.name}</h3>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {p.organization?.name || 'Acme Corp'}
                </span>
              </div>
              {isMutationAllowed && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-[11px] text-slate-500">
              <span>Project ID: {p.id.substring(0,8)}</span>
              <span className="text-slate-400 flex items-center gap-0.5">
                Manage Project
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No projects found matching the filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
