import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Pause, Play, Settings, Trash2, Plus, Sparkles, FolderKanban, Check, X, RefreshCw 
} from 'lucide-react';

export default function Queues() {
  const [queues, setQueues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Queue Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState(1);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [formError, setFormError] = useState('');

  // Editing state
  const [editingQueueId, setEditingQueueId] = useState(null);
  const [editPriority, setEditPriority] = useState(1);
  const [editConcurrency, setEditConcurrency] = useState(10);

  // Default setup helpers
  const [initLoading, setInitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queuesRes, projectsRes] = await Promise.all([
        api.get('/queues'),
        api.get('/projects')
      ]);
      setQueues(queuesRes.data);
      setProjects(projectsRes.data);
      if (projectsRes.data.length > 0) {
        setProjectId(projectsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return;

    try {
      const res = await api.post('/queues', {
        name,
        projectId,
        priority: parseInt(priority),
        maxConcurrency: parseInt(maxConcurrency)
      });
      setQueues([...queues, res.data]);
      setName('');
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create queue');
    }
  };

  const handlePause = async (id) => {
    try {
      const res = await api.put(`/queues/${id}/pause`);
      setQueues(queues.map(q => q.id === id ? res.data : q));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async (id) => {
    try {
      const res = await api.put(`/queues/${id}/resume`);
      setQueues(queues.map(q => q.id === id ? res.data : q));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this queue? This cascades to all jobs.')) return;
    try {
      await api.delete(`/queues/${id}`);
      setQueues(queues.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (q) => {
    setEditingQueueId(q.id);
    setEditPriority(q.priority);
    setEditConcurrency(q.maxConcurrency);
  };

  const handleSaveSettings = async (id) => {
    try {
      const res = await api.put(`/queues/${id}/settings?priority=${editPriority}&maxConcurrency=${editConcurrency}`);
      setQueues(queues.map(q => q.id === id ? res.data : q));
      setEditingQueueId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSetup = async () => {
    setInitLoading(true);
    try {
      // 1. Create Organization
      const orgRes = await api.post('/organizations', { name: 'Acme Corp' });
      // 2. Create Project
      const projRes = await api.post(`/projects?organizationId=${orgRes.data.id}`, { name: 'Production Logistics' });
      // 3. Create Default Queue
      const queueRes = await api.post('/queues', {
        name: 'default-processing',
        projectId: projRes.data.id,
        priority: 1,
        maxConcurrency: 10
      });
      // 4. Create Retry Policies (Fixed 5s, Linear 5s, Exponential 2s)
      await api.post('/jobs', {
        name: 'dummy',
        queueId: queueRes.data.id,
        payload: '{}'
      }); // submission test
      
      await fetchData();
    } catch (err) {
      console.error('Failed quick setup:', err);
    } finally {
      setInitLoading(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Queue Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Configure priorities, concurrency limits, and execute flow states</p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" />
            Create Queue
          </button>
        )}
      </div>

      {/* No Project Safeguard */}
      {projects.length === 0 && (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/5">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No active projects found</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
              Before creating queues, you need an active Project and Organization structure. Click below to automatically provision default elements!
            </p>
          </div>
          <button
            onClick={handleQuickSetup}
            disabled={initLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition disabled:opacity-50"
          >
            {initLoading ? 'Provisioning...' : 'Provision Default Setup'}
          </button>
        </div>
      )}

      {/* Queue Addition Form Modal */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-xl">
          <h4 className="text-base font-bold text-white mb-4">Create New Job Queue</h4>
          {formError && <div className="p-3 mb-4 rounded bg-rose-950/40 border border-rose-900 text-rose-400 text-xs">{formError}</div>}
          <form onSubmit={handleCreateQueue} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Queue Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. email-delivery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Scope</label>
                <select
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Queue Priority (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Concurrency Limit</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  value={maxConcurrency}
                  onChange={(e) => setMaxConcurrency(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Save Queue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Queues Table */}
      {queues.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Queue Name</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Max Concurrency</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
              {queues.map((q) => {
                const isEditing = editingQueueId === q.id;

                return (
                  <tr key={q.id} className="hover:bg-slate-950/20 transition">
                    <td className="px-6 py-4 font-semibold text-white">{q.name}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                        {q.project?.name || 'Global'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-16 bg-slate-950 border border-slate-800 rounded py-1 px-2 text-xs focus:outline-none"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        />
                      ) : (
                        <span className="px-2 py-1 bg-slate-800/80 rounded text-xs text-slate-400">Priority {q.priority}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-16 bg-slate-950 border border-slate-800 rounded py-1 px-2 text-xs focus:outline-none"
                          value={editConcurrency}
                          onChange={(e) => setEditConcurrency(e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-400">{q.maxConcurrency} parallel runs</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${q.isPaused ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${q.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        {q.isPaused ? 'Paused' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveSettings(q.id)}
                              className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-900/30 rounded hover:bg-emerald-500/20 transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingQueueId(null)}
                              className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(q)}
                              className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 hover:text-white transition"
                              title="Queue Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => q.isPaused ? handleResume(q.id) : handlePause(q.id)}
                              className={`p-1.5 rounded transition ${q.isPaused ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                              title={q.isPaused ? 'Resume Processing' : 'Pause Processing'}
                            >
                              {q.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded transition"
                              title="Delete Queue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
