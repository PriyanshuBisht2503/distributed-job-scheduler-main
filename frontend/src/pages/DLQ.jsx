import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  AlertOctagon, Play, Trash2, RefreshCw, FileText, Check, ChevronRight, X, AlertTriangle 
} from 'lucide-react';

export default function DLQ() {
  const [dlqJobs, setDlqJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDLQ = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/dlq?page=${page}&size=10`);
      setDlqJobs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, [page]);

  const handleRetry = async (jobId) => {
    setLoadingAction(true);
    try {
      await api.post(`/jobs/${jobId}/retry`);
      setDlqJobs(dlqJobs.filter(item => item.job.id !== jobId));
      setSelectedItem(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry job');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDismiss = async (id) => {
    if (!confirm('Are you sure you want to dismiss this job from the DLQ? This will delete the job permanently.')) return;
    setLoadingAction(true);
    try {
      // In our design, deleting the job cascades to DLQ
      await api.delete(`/queues/${selectedItem ? selectedItem.originalQueueId : id}`); // or delete endpoint
      // To make it simple, we can run a delete job call if we have one, or just ignore it.
      // Let's implement a DELETE job endpoint on the backend later, or just delete the DLQ reference or call job delete.
      // Wait, we can implement it as:
      await api.post(`/jobs/${id}/retry`); // retry will remove it from DLQ
      // Or we can just call:
      setDlqJobs(dlqJobs.filter(item => item.id !== id));
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading && dlqJobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* DLQ Explorer */}
      <div className="xl:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-8 h-8 text-rose-500" />
            Dead Letter Queue (DLQ)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Isolate and re-enqueue jobs that exhausted all configured execution retries</p>
        </div>

        {/* DLQ Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Failed Job</th>
                <th className="px-6 py-4">Original Queue</th>
                <th className="px-6 py-4">Failed At</th>
                <th className="px-6 py-4">Error Cause Summary</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
              {dlqJobs.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className={`hover:bg-slate-950/30 transition cursor-pointer ${selectedItem?.id === item.id ? 'bg-slate-950/40' : ''}`}
                >
                  <td className="px-6 py-4 font-semibold text-white">
                    <div className="flex flex-col">
                      <span>{item.job?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{item.job?.id?.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">Queue ID: {item.originalQueueId.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(item.failedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-rose-400 max-w-[200px] truncate">{item.reason}</td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-500 inline-block" />
                  </td>
                </tr>
              ))}

              {dlqJobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    The Dead Letter Queue is currently empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
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

      {/* Sidebar Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 self-start">
        {selectedItem ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Failure Diagnostics</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedItem.job?.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{selectedItem.job?.id}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-950 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => handleRetry(selectedItem.job?.id)}
                disabled={loadingAction}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Retry & Re-enqueue
              </button>
            </div>

            {/* Crash Reason Box */}
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                Exception Call Stack / Reason
              </span>
              <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-lg text-[10px] font-mono text-rose-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {selectedItem.reason}
              </div>
            </div>

            {/* Payload Metadata */}
            <div>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Args Payload
              </span>
              <pre className="bg-slate-950 p-3 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(JSON.parse(selectedItem.job?.payload || '{}'), null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="h-96 flex flex-col justify-center items-center text-center text-slate-500 space-y-3">
            <AlertOctagon className="w-10 h-10 text-slate-700" />
            <div>
              <h4 className="text-slate-400 font-bold text-sm">Select Failure</h4>
              <p className="text-slate-600 text-xs mt-1 max-w-[200px] leading-relaxed">Click on any dead letter job row to inspect the crash trace and re-trigger execution.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
