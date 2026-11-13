import React, { useState } from 'react';
import { 
  Sliders, ShieldAlert, Cpu, Heart, Check, RefreshCw 
} from 'lucide-react';

export default function Settings() {
  const [concurrency, setConcurrency] = useState(10);
  const [pollInterval, setPollInterval] = useState(1000);
  const [heartbeatRate, setHeartbeatRate] = useState(5000);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-8 h-8 text-blue-500" />
          System Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure global thread pools, heartbeat limits, and scheduling triggers</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          Worker Performance Configs
        </h3>

        {saved && (
          <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <Check className="w-4 h-4" />
            Global settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Worker Thread Concurrency Cap</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
              />
              <span className="text-[10px] text-slate-500 block mt-1.5">Maximum number of parallel task executions per daemon node.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">DB Poll Interval (ms)</label>
              <input
                type="number"
                min="100"
                max="10000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                value={pollInterval}
                onChange={(e) => setPollInterval(e.target.value)}
              />
              <span className="text-[10px] text-slate-500 block mt-1.5">Delay between sequential database queries seeking available jobs.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Heartbeat Telemetry Rate (ms)</label>
              <input
                type="number"
                min="1000"
                max="60000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                value={heartbeatRate}
                onChange={(e) => setHeartbeatRate(e.target.value)}
              />
              <span className="text-[10px] text-slate-500 block mt-1.5">Frequency at which CPU/RAM statistics are written to database telemetry log tables.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Health Warnings</label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-800 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-400">Trigger warnings for slow queries</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-5 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition"
            >
              Commit Global Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
