import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Plus, Calendar, Play, RefreshCw, Layers, Terminal, AlertTriangle, FileText, ChevronRight, X, Clock
} from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState('');
  const [queueFilter, setQueueFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Add Job Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [queueId, setQueueId] = useState('');
  const [payload, setPayload] = useState('{\n  "duration": 500,\n  "fail": false\n}');
  const [priority, setPriority] = useState(0);
  const [jobType, setJobType] = useState('IMMEDIATE'); // IMMEDIATE, DELAYED, CRON
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [cronExpression, setCronExpression] = useState('*/10 * * * * *'); // default every 10s
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail panel state
  const [selectedJob, setSelectedJob] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchJobs = async () => {
    try {
      let url = `/jobs?page=${page}&size=10`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (queueFilter) url += `&queueId=${queueFilter}`;

      const res = await api.get(url);
      setJobs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueues = async () => {
    try {
      const res = await api.get('/queues');
      setQueues(res.data);
      if (res.data.length > 0) {
        setQueueId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, queueFilter]);

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setLoadingDetails(true);
    try {
      const [execRes, logsRes] = await Promise.all([
        api.get(`/jobs/${job.id}/executions`),
        api.get(`/jobs/${job.id}/logs`)
      ]);
      setExecutions(execRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      // Validate payload JSON
      try {
        JSON.parse(payload);
      } catch (err) {
        throw new Error('Invalid JSON payload formatting.');
      }

      const body = {
        name,
        queueId,
        payload,
        priority: parseInt(priority)
      };

      if (jobType === 'DELAYED') {
        body.delaySeconds = parseInt(delaySeconds);
      } else if (jobType === 'CRON') {
        body.cronExpression = cronExpression;
      }

      await api.post('/jobs', body);
      setName('');
      setShowAddForm(false);
      fetchJobs();
    } catch (err) {
      setFormError(err.message || err.response?.data?.message || 'Failed to submit job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualRetry = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/retry`);
      fetchJobs();
      if (selectedJob && selectedJob.id === jobId) {
        // reload details
        handleSelectJob(selectedJob);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry job');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Jobs Explorer List */}
      <div className="xl:col-span-2 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Job Explorer</h1>
            <p className="text-slate-400 text-sm mt-1">Submit, monitor, and troubleshoot distributed tasks</p>
          </div>
          {queues.length > 0 && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition"
            >
              <Plus className="w-4 h-4" />
              Enqueue Job
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Queue Filter</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              value={queueFilter}
              onChange={(e) => { setQueueFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Queues</option>
              {queues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Filter</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Statuses</option>
              <option value="QUEUED">QUEUED</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CLAIMED">CLAIMED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="RETRY">RETRY</option>
              <option value="DLQ">DLQ</option>
            </select>
          </div>

          <button
            onClick={fetchJobs}
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition mt-4"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Job submit modal panel */}
        {showAddForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Submit New Task</h3>
            {formError && <div className="p-3 mb-4 rounded bg-rose-950/40 border border-rose-900 text-rose-400 text-xs">{formError}</div>}
            
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. process-invoice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Queue</label>
                  <select
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    value={queueId}
                    onChange={(e) => setQueueId(e.target.value)}
                  >
                    {queues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Execution Pattern</label>
                  <select
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="IMMEDIATE">Immediate Execution</option>
                    <option value="DELAYED">Delayed Trigger</option>
                    <option value="CRON">Recurring Cron Schedule</option>
                  </select>
                </div>

                {jobType === 'DELAYED' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Delay (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(e.target.value)}
                    />
                  </div>
                )}

                {jobType === 'CRON' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cron Expression</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                      placeholder="*/10 * * * * *"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority Weight</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">JSON Arguments Payload</label>
                <textarea
                  rows="3"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                />
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
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Jobs list table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Job Name</th>
                <th className="px-6 py-4">Queue</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Schedule (Run At)</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
              {jobs.map((job) => {
                const statusStyles = {
                  QUEUED: 'bg-slate-800 text-slate-400 border-slate-700/50',
                  SCHEDULED: 'bg-blue-950/50 text-blue-400 border-blue-900/30',
                  CLAIMED: 'bg-indigo-950/50 text-indigo-400 border-indigo-900/30',
                  RUNNING: 'bg-sky-950/50 text-sky-400 border-sky-900/30 animate-pulse',
                  COMPLETED: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/30',
                  FAILED: 'bg-rose-950/50 text-rose-400 border-rose-900/30',
                  RETRY: 'bg-amber-950/50 text-amber-400 border-amber-900/30',
                  DLQ: 'bg-red-950/80 text-red-300 border-red-900/50'
                };

                return (
                  <tr 
                    key={job.id} 
                    onClick={() => handleSelectJob(job)}
                    className={`hover:bg-slate-950/30 transition cursor-pointer ${selectedJob?.id === job.id ? 'bg-slate-950/40' : ''}`}
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex flex-col">
                        <span>{job.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{job.id.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{job.queueName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[job.status] || 'bg-slate-800'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {job.cronExpression ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Cron: {job.cronExpression}
                        </span>
                      ) : (
                        new Date(job.runAt).toLocaleTimeString()
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500 inline-block" />
                    </td>
                  </tr>
                );
              })}

              {jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No matching jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-slate-800 bg-slate-950/20">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-xs text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-xs text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side Detail Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 self-start">
        {selectedJob ? (
          <>
            {/* Detail Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job details</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedJob.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{selectedJob.id}</span>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-950 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            {(selectedJob.status === 'FAILED' || selectedJob.status === 'DLQ') && (
              <button
                onClick={() => handleManualRetry(selectedJob.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
              >
                <Play className="w-3.5 h-3.5" />
                Retry Failed Job
              </button>
            )}

            {/* Config metadata fields */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-4 text-xs text-slate-400">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Priority</p>
                <p className="font-bold text-slate-200 mt-0.5">{selectedJob.priority}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Retries</p>
                <p className="font-bold text-slate-200 mt-0.5">{selectedJob.retryCount} / {selectedJob.maxRetries}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Target Queue</p>
                <p className="font-bold text-slate-200 mt-0.5">{selectedJob.queueName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Scheduled run</p>
                <p className="font-bold text-slate-200 mt-0.5">{new Date(selectedJob.runAt).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Payload */}
            <div>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Payload Content
              </span>
              <pre className="bg-slate-950 p-3 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(JSON.parse(selectedJob.payload || '{}'), null, 2)}
              </pre>
            </div>

            {/* Execution logs tab */}
            <div className="space-y-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                <Terminal className="w-4 h-4 text-slate-500" />
                Execution Logs ({logs.length})
              </span>
              
              {loadingDetails ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {logs.map((log) => {
                    const levelColors = {
                      INFO: 'text-blue-400',
                      WARNING: 'text-amber-400',
                      ERROR: 'text-rose-400'
                    };
                    return (
                      <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono leading-relaxed">
                        <div className="flex justify-between text-slate-500 text-[9px] mb-1">
                          <span className={levelColors[log.logLevel] || 'text-slate-400'}>[{log.logLevel}]</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300">{log.message}</p>
                      </div>
                    );
                  })}

                  {logs.length === 0 && (
                    <p className="text-slate-500 text-center py-4 text-[11px]">No log entries recorded.</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-96 flex flex-col justify-center items-center text-center text-slate-500 space-y-3">
            <Layers className="w-10 h-10 text-slate-700" />
            <div>
              <h4 className="text-slate-400 font-bold text-sm">No Job Selected</h4>
              <p className="text-slate-600 text-xs mt-1 max-w-[200px]">Click any job row to view its details, logs, and executions.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
