import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Queues from './pages/Queues';
import Jobs from './pages/Jobs';
import Workers from './pages/Workers';
import DLQ from './pages/DLQ';
import Login from './pages/Login';
import Organizations from './pages/Organizations';
import Projects from './pages/Projects';
import RetryPolicies from './pages/RetryPolicies';
import ScheduledJobs from './pages/ScheduledJobs';
import Metrics from './pages/Metrics';
import ExecutionLogs from './pages/ExecutionLogs';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { 
  LayoutDashboard, Layers, Server, AlertTriangle, Shield, LogOut, Terminal, 
  Building, Folder, Award, Calendar as CalendarIcon, BarChart2, FileText, Sliders, User 
} from 'lucide-react';

function ProtectedLayout({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Organizations', path: '/organizations', icon: Building },
    { label: 'Projects', path: '/projects', icon: Folder },
    { label: 'Queues', path: '/queues', icon: Layers },
    { label: 'Job Explorer', path: '/jobs', icon: Terminal },
    { label: 'Retry Policies', path: '/retry-policies', icon: Award },
    { label: 'Scheduled Jobs', path: '/scheduled', icon: CalendarIcon },
    { label: 'Worker Monitor', path: '/workers', icon: Server },
    { label: 'Dead Letter Queue', path: '/dlq', icon: AlertTriangle },
    { label: 'Metrics', path: '/metrics', icon: BarChart2 },
    { label: 'Execution Logs', path: '/logs', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Sliders },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/20">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow shadow-blue-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">Job</span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5">Scheduler</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition ${active ? 'bg-blue-600 text-white shadow shadow-blue-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-4">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 bg-blue-500/15 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs uppercase">
              {JSON.parse(localStorage.getItem('user') || '{}').username?.substring(0,2) || 'US'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-200 leading-none">{JSON.parse(localStorage.getItem('user') || '{}').username || 'User'}</p>
              <span className="text-[9px] text-slate-500 font-bold uppercase">{JSON.parse(localStorage.getItem('user') || '{}').role || 'Role'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content body container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/organizations" element={<ProtectedLayout><Organizations /></ProtectedLayout>} />
        <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
        <Route path="/queues" element={<ProtectedLayout><Queues /></ProtectedLayout>} />
        <Route path="/jobs" element={<ProtectedLayout><Jobs /></ProtectedLayout>} />
        <Route path="/retry-policies" element={<ProtectedLayout><RetryPolicies /></ProtectedLayout>} />
        <Route path="/scheduled" element={<ProtectedLayout><ScheduledJobs /></ProtectedLayout>} />
        <Route path="/workers" element={<ProtectedLayout><Workers /></ProtectedLayout>} />
        <Route path="/dlq" element={<ProtectedLayout><DLQ /></ProtectedLayout>} />
        <Route path="/metrics" element={<ProtectedLayout><Metrics /></ProtectedLayout>} />
        <Route path="/logs" element={<ProtectedLayout><ExecutionLogs /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
