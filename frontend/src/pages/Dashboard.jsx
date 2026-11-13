import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
  Activity, Server, ListTodo, AlertTriangle, CheckCircle2, Clock, RefreshCw 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed fetching stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Establish Server-Sent Events (SSE) connection for live updates
    const eventSource = new EventSource('http://localhost:8080/api/stream/metrics');
    
    eventSource.addEventListener('metrics', (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed parsing SSE payload:', err);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    // Backup HTTP poll every 10 seconds
    const interval = setInterval(() => fetchStats(true), 10000);
    
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Pre-process charts data
  const executionsData = Object.entries(stats?.executionsOverTime || {}).map(([time, count]) => ({
    time: time.split(' ')[1] || time,
    executions: count
  }));

  const queueData = Object.entries(stats?.jobsByQueue || {}).map(([name, count]) => ({
    name,
    jobs: count
  }));

  const colors = ['#0c85e4', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

  const successRate = stats?.totalJobs > 0 
    ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) 
    : '100';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time health and execution performance overview</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Workers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workers</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{stats?.activeWorkers}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            Heartbeats running
          </div>
        </div>

        {/* Queued Jobs */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queued Tasks</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{stats?.queuedJobs}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-purple-400">Pending</span> worker pick up
          </div>
        </div>

        {/* Dead Letter Queue */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dead Letter Queue</p>
              <h3 className="text-3xl font-extrabold text-rose-500 mt-2">{stats?.dlqJobs}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`font-semibold ${stats?.dlqJobs > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
              {stats?.dlqJobs} failures
            </span> pending review
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Success Ratio</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{successRate}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Avg Latency: <span className="font-bold text-white">{stats?.averageExecutionTimeMs?.toFixed(0)} ms</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Executions Flow Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h4 className="text-base font-bold text-white mb-6">Throughput Volume (Last 24 Hours)</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executionsData}>
                <defs>
                  <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c85e4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0c85e4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="executions" stroke="#0c85e4" strokeWidth={2} fillOpacity={1} fill="url(#colorExec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Jobs by Queue Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h4 className="text-base font-bold text-white mb-6">Queue Distribution</h4>
          <div className="h-80 w-full flex flex-col justify-between">
            {queueData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                No active queues configured.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    />
                    <Bar dataKey="jobs" radius={[4, 4, 0, 0]}>
                      {queueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 border-t border-slate-800/80 pt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
              {queueData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
