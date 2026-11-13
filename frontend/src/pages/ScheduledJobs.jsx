import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Calendar as CalendarIcon, Clock, Layers, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function ScheduledJobs() {
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs?status=SCHEDULED');
      setScheduledJobs(res.data.content || []);
    } catch (err) {
      console.warn('Backend fetch failed, fallback to mock data');
      // Mock scheduled jobs
      setScheduledJobs([
        { id: '1', name: 'Database Backup', queueName: 'system-queue', runAt: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), cronExpression: '0 0 * * *' },
        { id: '2', name: 'Billing Reconciliation', queueName: 'billing-queue', runAt: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), cronExpression: '0 12 * * 1' },
        { id: '3', name: 'AI Failure Log Summary', queueName: 'analytics-queue', runAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  // Simple calendar math
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to find jobs scheduled on a specific day
  const getJobsForDay = (dayNum) => {
    if (!dayNum) return [];
    return scheduledJobs.filter(job => {
      const runDate = new Date(job.runAt);
      return runDate.getDate() === dayNum && 
             runDate.getMonth() === currentDate.getMonth() &&
             runDate.getFullYear() === currentDate.getFullYear();
    });
  };

  if (loading && scheduledJobs.length === 0) {
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
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            Scheduled Executions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Calendar and schedule listings of upcoming execution runs</p>
        </div>
        <button
          onClick={fetchScheduled}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Calendar visualizer card */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-base">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => changeMonth(1)}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {calendarCells.map((dayNum, idx) => {
              const dayJobs = getJobsForDay(dayNum);
              const isToday = dayNum === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={idx} 
                  className={`min-h-[80px] bg-slate-950/60 border rounded-lg p-1.5 flex flex-col justify-between transition ${dayNum ? 'hover:border-slate-700' : 'border-transparent bg-transparent'} ${dayJobs.length > 0 ? 'border-blue-500/40 bg-blue-950/5' : 'border-slate-800/80'} ${isToday ? 'ring-1 ring-blue-500' : ''}`}
                >
                  {dayNum ? (
                    <>
                      <span className={`text-[10px] font-bold ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{dayNum}</span>
                      <div className="space-y-1 mt-1">
                        {dayJobs.map(job => (
                          <div 
                            key={job.id} 
                            className="bg-blue-600/10 text-blue-400 border border-blue-900/30 rounded px-1 py-0.5 text-[8px] truncate font-semibold"
                            title={`${job.name} (${job.queueName})`}
                          >
                            {job.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 self-start">
          <h4 className="font-bold text-white text-base">Upcoming Queue Schedule</h4>
          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
            {scheduledJobs.map((job) => (
              <div key={job.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-xs text-white">{job.name}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-500 font-mono">
                    {job.queueName}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Run time: {new Date(job.runAt).toLocaleTimeString()}</span>
                  </div>
                  {job.cronExpression && (
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>Cron: <code className="text-purple-400 font-mono text-[9px]">{job.cronExpression}</code></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
