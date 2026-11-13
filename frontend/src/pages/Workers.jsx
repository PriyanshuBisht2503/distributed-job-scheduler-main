import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Server, Cpu, Database, CpuIcon, Trash2, Heart, RefreshCw 
} from 'lucide-react';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [heartbeats, setHeartbeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
      if (res.data.length > 0 && !selectedWorker) {
        handleSelectWorker(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = async (worker) => {
    setSelectedWorker(worker);
    setLoadingMetrics(true);
    try {
      const res = await api.get(`/workers/${worker.id}/heartbeats?limit=20`);
      // Recharts expects chronological order (oldest to newest)
      const sortedHb = [...res.data].reverse();
      setHeartbeats(sortedHb);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleDeleteWorker = async (id) => {
    if (!confirm('Are you sure you want to remove this worker registration?')) return;
    try {
      await api.delete(`/workers/${id}`);
      setWorkers(workers.filter(w => w.id !== id));
      if (selectedWorker?.id === id) {
        setSelectedWorker(null);
        setHeartbeats([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkers();
    // Poll workers every 10 seconds
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && workers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Map heartbeats to chart-friendly formats
  const chartData = heartbeats.map(hb => ({
    time: new Date(hb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: hb.cpuUsage,
    ram: hb.memoryUsage,
    jobs: hb.activeJobs
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Worker Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">Track JVM host telemetry and CPU/RAM usage of processing threads</p>
        </div>
        <button
          onClick={fetchWorkers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Workers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Worker Instances List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 self-start">
          <h4 className="text-base font-bold text-white mb-2">Daemon Node Registries</h4>
          <div className="space-y-3">
            {workers.map((worker) => {
              const isActive = worker.status === 'ACTIVE';
              const isSelected = selectedWorker?.id === worker.id;

              return (
                <div 
                  key={worker.id}
                  onClick={() => handleSelectWorker(worker)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${isSelected ? 'bg-slate-950 border-blue-500' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-white">{worker.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{worker.host}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`}></span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWorker(worker.id); }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition"
                      title="De-register Worker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {workers.length === 0 && (
              <p className="text-slate-500 text-center py-6 text-xs">No background worker services active.</p>
            )}
          </div>
        </div>

        {/* Real-time Telemetry Charts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          {selectedWorker ? (
            <>
              {/* Telemetry Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedWorker.name} Metrics</h4>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono">Last heartbeat: {new Date(selectedWorker.lastHeartbeat).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                    Telemetrics Active
                  </span>
                </div>
              </div>

              {loadingMetrics ? (
                <div className="h-96 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Cpu area chart */}
                  <div className="space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      CPU Utilization (%)
                    </span>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38a1f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#38a1f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Area type="monotone" dataKey="cpu" stroke="#38a1f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCpu)" name="CPU Load" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* RAM and Jobs active area chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RAM */}
                    <div className="space-y-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Database className="w-4 h-4 text-slate-500" />
                        Memory Utilization (%)
                      </span>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                            <Area type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRam)" name="RAM Load" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Active Thread Jobs */}
                    <div className="space-y-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <CpuIcon className="w-4 h-4 text-slate-500" />
                        Active Job Threads
                      </span>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                            <Area type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorJobs)" name="Active Threads" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-96 flex flex-col justify-center items-center text-center text-slate-500 space-y-3">
              <Server className="w-12 h-12 text-slate-700" />
              <div>
                <h4 className="text-slate-400 font-bold text-sm">Select Worker</h4>
                <p className="text-slate-600 text-xs mt-1 max-w-xs leading-relaxed">Choose a daemon node from the registry on the left to examine its JVM CPU/Memory utilization history.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
