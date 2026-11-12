import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import StatCard from '../components/shared/StatCard';
import { formatCurrency, CATEGORY_LABELS, formatDateTime } from '../utils/helpers';
import { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import ComplaintMap from '../components/ComplaintMap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis
} from 'recharts';
import Chatbot from '../components/Chatbot';
import {
  Landmark,
  FileText,
  Users,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  IndianRupee,
  Zap,
  BarChart3,
  List,
  PieChart as PieChartIcon,
  Download,
  ShieldAlert,
  UserX,
  AlertTriangle,
  MapPin,
  Send,
  XCircle,
  TrendingUp,
  Tag,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Change these two lines to rename the office everywhere on this page
const OFFICE_NAME = "Mayor's Office";
const OFFICE_SHORT = 'Mayor';

const SIDEBAR_LINKS = [{ path: '/cm', icon: Building2, label: `${OFFICE_SHORT} Dashboard` }];
const COLORS_ARR = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const PAGE_SIZE = 20;

// Up to 5 page numbers around the current page
const getPageList = (current, total) => {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};

export default function CMDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deptPerf, setDeptPerf] = useState([]);
  const [catDist, setCatDist] = useState([]);
  const [trends, setTrends] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);
  const [reviewList, setReviewList] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedDept, setSelectedDept] = useState({});
  const [diverting, setDiverting] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // "All Complaints" table (server-side pagination)
  const [tableComplaints, setTableComplaints] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tablePagination, setTablePagination] = useState({ total: 0, pages: 1 });
  const [tableLoading, setTableLoading] = useState(false);

  // Build a usable image URL (backend serves /uploads)
  const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const imageUrl = (p) => (!p ? null : /^https?:/i.test(p) ? p : `${API_ORIGIN}${p}`);

  console.log('✅ CMDashboard DEBUG FILE LOADED');
  console.log('📌 Current complaints state:', complaints);
  console.log('📌 Current stats state:', stats);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchTable = async (p = tablePage) => {
    try {
      setTableLoading(true);
      const { data } = await api.get(`/cm/complaints?page=${p}&limit=${PAGE_SIZE}`);
      const list = data.complaints || [];
      setTableComplaints(list);
      setTablePagination({
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1
      });
      // If the last item on the last page was just removed, step back one page
      if (list.length === 0 && p > 1) setTablePage(p - 1);
    } catch (err) {
      console.error('fetchTable failed:', err?.response?.data || err.message);
      toast.error('Failed to load complaints');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTable(tablePage);
  }, [tablePage]);

  const fetchReview = async () => {
    try {
      const { data } = await api.get('/cm/review-complaints');
      setReviewList(data.complaints || []);
      setReviewCount(data.total ?? (data.complaints || []).length);
    } catch (err) {
      console.error('fetchReview failed:', err?.response?.data || err.message);
    }
  };

  // Load now, then re-check every 30 seconds so new complaints show up on their own
  useEffect(() => {
    fetchReview();
    const timer = setInterval(fetchReview, 30000);
    return () => clearInterval(timer);
  }, []);

  const removeFromReview = (id) => {
    setReviewList((list) => list.filter((x) => x._id !== id));
    setReviewCount((n) => Math.max(0, n - 1));
  };

  const errMsg = (err, fallback) =>
    err.response?.data?.message ||
    (err.response?.status === 404 ? 'Route not found. Restart or redeploy the backend with the latest cm routes.' : fallback);

  const isGone = (err) => err.response?.data?.message === 'Complaint not found';

  const handleDivert = async (c) => {
    const departmentId = selectedDept[c._id] || c.suggestedDepartmentId?._id;
    if (!departmentId) return toast.error('Select a department first');
    try {
      setDiverting(c._id);
      await api.put(`/cm/complaints/${c._id}/reassign`, { departmentId });
      toast.success('Complaint routed successfully');
      removeFromReview(c._id);
      fetchAll();
      fetchTable(tablePage);
    } catch (err) {
      if (isGone(err)) {
        toast.error('This complaint no longer exists');
        removeFromReview(c._id);
        fetchReview();
      } else {
        toast.error(errMsg(err, 'Failed to route complaint'));
      }
    } finally {
      setDiverting(null);
    }
  };

  const handleReject = async (c) => {
    try {
      setRejecting(true);
      await api.put(`/cm/complaints/${c._id}/reject`, { reason: rejectReason });
      toast.success('Complaint rejected');
      removeFromReview(c._id);
      setRejectingId(null);
      setRejectReason('');
      fetchAll();
      fetchTable(tablePage);
    } catch (err) {
      if (isGone(err)) {
        toast.error('This complaint no longer exists');
        removeFromReview(c._id);
        setRejectingId(null);
        fetchReview();
      } else {
        toast.error(errMsg(err, 'Failed to reject complaint'));
      }
    } finally {
      setRejecting(false);
    }
  };

  const fetchAll = async () => {
    try {
      console.log('🚀 fetchAll started');

      const [s, d, c, t, comp] = await Promise.all([
        api.get('/cm/stats'),
        api.get('/cm/department-performance'),
        api.get('/cm/category-distribution'),
        api.get('/cm/monthly-trends'),
        api.get('/cm/complaints?limit=100')
      ]);

      console.log('✅ /cm/stats', s.data);
      console.log('✅ /cm/department-performance', d.data);
      console.log('✅ /cm/category-distribution', c.data);
      console.log('✅ /cm/monthly-trends', t.data);
      console.log('✅ /cm/complaints', comp.data);

      setStats(s.data.stats);
      setDeptPerf(d.data.performance || []);
      setCatDist(
        (c.data.distribution || []).map((x) => ({
          name: CATEGORY_LABELS[x._id] || x._id || 'Unknown',
          value: x.count || 0
        }))
      );
      setTrends(
        (t.data.trends || []).map((x) => ({
          name: `${x._id.month}/${x._id.year}`,
          total: x.total,
          resolved: x.resolved
        }))
      );
      setComplaints(comp.data.complaints || []);

      console.log('✅ State set successfully');
    } catch (err) {
      console.error('❌ fetchAll failed:', err);
      console.error('❌ fetchAll response:', err?.response?.data);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      console.log('✅ loading false');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      console.log('📥 Report download clicked');
      setDownloading(true);

      const response = await api.get('/cm/export-excel', {
        responseType: 'blob'
      });

      console.log('✅ Report response received:', response);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `CM_Dashboard_Report_${today}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('❌ Report download failed:', err);
      console.error('❌ Report error response:', err?.response?.data);
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const radarData = deptPerf.slice(0, 6).map((d) => ({
    dept: d.code || d.name?.substring(0, 6) || 'NA',
    score: d.resolutionRate || 0
  }));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'complaints', label: 'All Complaints', icon: List },
    { id: 'review', label: 'Needs Review', icon: AlertTriangle, badge: reviewCount },
    { id: 'analytics', label: 'Advanced Analytics', icon: PieChartIcon }
  ];

  // Compact summary strip (replaces 7 separate stat boxes)
  const summaryItems = [
    { label: 'Citizens', value: stats?.totalCitizens || 0, icon: Users, color: 'text-indigo-400' },
    { label: 'Departments', value: stats?.totalDepartments || 0, icon: Building2, color: 'text-teal-400' },
    { label: 'Total Expense', value: formatCurrency(stats?.totalExpense), icon: IndianRupee, color: 'text-red-400' },
    { label: 'Resolution Rate', value: `${stats?.resolutionRate || 0}%`, icon: Zap, color: 'text-emerald-400' },
    { label: 'Fraud Complaints', value: stats?.fraudComplaints || 0, icon: ShieldAlert, color: 'text-red-400' },
    { label: 'Suspicious Users', value: stats?.suspiciousUsers || 0, icon: UserX, color: 'text-orange-400' },
    { label: 'Fraud Rate', value: `${stats?.fraudRate || 0}%`, icon: AlertTriangle, color: 'text-red-400' }
  ];

  const pageFrom = tablePagination.total === 0 ? 0 : (tablePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(tablePage * PAGE_SIZE, tablePagination.total);

  return (
    <PageTransition className="flex min-h-screen bg-background selection:bg-rose-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle={OFFICE_NAME} />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[1000px] h-[800px] bg-rose-900/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Landmark className="w-8 h-8 text-rose-500" /> City Governance Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Centralized monitoring of all city grievance operations
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleDownloadExcel}
                disabled={downloading}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : 'Download Report'}
              </button>

              <div className="text-xs font-mono text-gray-500 bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar border-b border-white/5">
            {tabs.map((t) => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-white/10 text-white border-b-2 border-rose-500'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${activeTab === t.id ? 'text-rose-400' : ''}`} />
                  {t.label}
                  {t.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                      {t.badge > 99 ? '99+' : t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

                   {activeTab === 'overview' && (
            <>
              {loading ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton h-24 rounded-2xl" />
                    ))}
                  </div>
                  <div className="skeleton h-20 rounded-2xl mb-10" />
                </>
              ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    <StatCard icon={FileText} label="Total Complaints" value={stats?.totalComplaints || 0} color="blue" />
                    <StatCard icon={CheckCircle} label="Resolved" value={stats?.completedComplaints || 0} color="green" />
                    <StatCard icon={Clock} label="Pending" value={stats?.pendingComplaints || 0} color="orange" />
                    <StatCard icon={RefreshCw} label="In Progress" value={stats?.inProgressComplaints || 0} color="purple" />
                    <StatCard icon={AlertTriangle} label="Under Review" value={stats?.reviewComplaints || 0} color="indigo" />
                    <StatCard icon={XCircle} label="Rejected" value={stats?.rejectedComplaints || 0} color="red" />
                  </div>

                  <GlassCard className="!p-4 sm:!p-5 mb-10" hover={false}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                      {summaryItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 min-w-0">
                          <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-black text-white truncate">{item.value}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                              {item.label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <div className="grid lg:grid-cols-2 gap-x-10 gap-y-10 mb-12">
                    <div className="card">
                      <h3 className="font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Monthly Trends</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trends} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ paddingTop: '12px' }} />
                          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="card">
                      <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Tag className="w-5 h-5" /> By Category</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
                          <Pie
                            data={catDist}
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            dataKey="value"
                            label={({ name, percent }) => {
                              const safeName = name ? String(name) : 'Unknown';
                              const shortName = safeName.includes(' ') ? safeName.split(' ')[1] : safeName;
                              return `${shortName}: ${(percent * 100).toFixed(0)}%`;
                            }}
                            labelLine={false}
                          >
                            {catDist.map((_, i) => (
                              <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Building2 className="w-5 h-5" /> Department Resolution Rates</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={deptPerf} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="resolutionRate" name="Resolution %" radius={[6, 6, 0, 0]}>
                          {deptPerf.map((_, i) => (
                            <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-12">
                    <ComplaintMap complaints={complaints} />
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6 animate-fadeInUp">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-3xl" />)
              ) : deptPerf.map((d) => (
                <GlassCard key={d.id} className="!p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6 border-b border-white/5 pb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{d.name}</h3>
                      <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-lg mt-2 inline-block shadow-sm tracking-wider uppercase">
                        {d.code}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-black ${d.resolutionRate >= 70 ? 'text-emerald-400' : d.resolutionRate >= 40 ? 'text-amber-400' : 'text-rose-400'} drop-shadow-lg`}>
                        {d.resolutionRate}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                        Resolution Rate
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-background rounded-full h-3 border border-white/5 overflow-hidden mb-6 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${d.resolutionRate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : d.resolutionRate >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-600 to-red-500'}`}
                      style={{ width: `${d.resolutionRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Volume', value: d.total, icon: List, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                      { label: 'Resolved Tickets', value: d.resolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Pending Triage', value: d.pending, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                      { label: 'Active Works', value: d.inProgress, icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                      { label: 'Fund Expenditure', value: formatCurrency(d.totalExpense), icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
                    ].map((item, idx) => (
                      <div key={idx} className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center ${item.bg}`}>
                        <item.icon className={`w-6 h-6 mb-2 ${item.color}`} />
                        <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {d.resolutionRate < 40 && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-5 py-4 text-sm text-rose-300 flex items-start gap-3 shadow-inner">
                      <Zap className="w-5 h-5 flex-shrink-0 text-rose-500" />
                      <div>
                        <strong className="text-rose-400 block mb-1">Critical Priority Alert!</strong>
                        Department resolution rate is below acceptable threshold (40%). Requires immediate intervention and resource allocation.
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

                    {activeTab === 'complaints' && (
            <GlassCard className="!p-0 overflow-hidden animate-fadeInUp" hover={false}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-400" /> City-Wide Registry
                </h3>
                <span className="text-sm text-gray-500 font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                  {tablePagination.total} Total
                </span>
              </div>

              <div className={`overflow-auto max-h-[60vh] min-h-[320px] custom-scrollbar px-2 pb-2 transition-opacity ${tableLoading ? 'opacity-60' : 'opacity-100'}`}>
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-background/95 sticky top-0 z-10 backdrop-blur-xl">
                    <tr>
                      {['ID', 'Subject', 'Category', 'Status', 'Priority', 'Department', 'Citizen', 'Filing Date'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableComplaints.length === 0 && !tableLoading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500 font-medium">
                          No complaints found
                        </td>
                      </tr>
                    )}
                    {tableComplaints.map((c) => (
                      <tr key={c._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-xs font-mono text-indigo-400 font-medium whitespace-nowrap">
                          {c.complaintNumber}
                        </td>
                        <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate group-hover:text-primary-300 transition-colors">
                          {c.title}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {CATEGORY_LABELS[c.category] || c.category}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400 whitespace-nowrap">
                          {c.departmentId?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-300">
                          {c.citizenId?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {formatDateTime(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Showing {pageFrom}-{pageTo} of {tablePagination.total}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage <= 1 || tableLoading}
                    className="px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  {getPageList(tablePage, tablePagination.pages).map((n) => (
                    <button
                      key={n}
                      onClick={() => setTablePage(n)}
                      disabled={tableLoading}
                      className={`min-w-[40px] px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                        n === tablePage
                          ? 'bg-primary-600 text-white shadow-primary-500/25'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    onClick={() => setTablePage((p) => Math.min(tablePagination.pages, p + 1))}
                    disabled={tablePage >= tablePagination.pages || tableLoading}
                    className="px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6 animate-fadeInUp">
              {reviewList.length === 0 ? (
                <GlassCard className="!p-10 text-center" hover={false}>
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-1">All caught up</h3>
                  <p className="text-gray-400 text-sm">
                    No complaints need review right now. New ones will appear here automatically.
                  </p>
                </GlassCard>
              ) : (
                reviewList.map((c) => {
                  const suggestedId = c.suggestedDepartmentId?._id || '';
                  const chosen = selectedDept[c._id] ?? suggestedId;
                  const isApprove = chosen && chosen === suggestedId;
                  const img = imageUrl(c.image);
                  const hasCoords = c.location?.lat && c.location?.lng;
                  const isRejectOpen = rejectingId === c._id;

                  return (
                    <GlassCard key={c._id} className="!p-4 sm:!p-6" hover={false}>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs font-mono text-indigo-400 font-bold">{c.complaintNumber}</span>
                        <PriorityBadge priority={c.priority} />
                        <span className="text-xs text-gray-500 ml-auto">{formatDateTime(c.createdAt)}</span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-5">
                        <div className="flex-1 min-w-0 space-y-4">
                          <h3 className="text-lg sm:text-xl font-bold text-white break-words">{c.title}</h3>
                          <p className="text-sm text-gray-300 whitespace-pre-line break-words">{c.description}</p>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 min-w-0">
                              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Submitted By</div>
                              <div className="text-sm font-semibold text-white break-words">{c.citizenId?.name || '—'}</div>
                              <div className="text-xs text-gray-400 break-all">{c.citizenId?.email || ''}</div>
                              {c.citizenId?.phone && <div className="text-xs text-gray-400">{c.citizenId.phone}</div>}
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 min-w-0">
                              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Location</div>
                              <div className="text-sm text-white break-words flex items-start gap-1.5">
                                <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <span>{c.location?.address || 'No address provided'}</span>
                              </div>
                              {hasCoords && (
                                <a
                                  href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary-400 hover:underline mt-1 inline-block font-mono break-all"
                                >
                                  {c.location.lat}, {c.location.lng} · Open map
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-200 min-w-0">
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Why this needs review
                            </div>
                            <div className="break-words">
                              AI suggestion: <strong>{CATEGORY_LABELS[c.aiCategory] || c.aiCategory || 'None'}</strong>
                              {' '}({Math.round((c.aiConfidence || 0) * 100)}% confidence)
                              {c.aiReason ? ` — ${c.aiReason}` : ''}
                            </div>
                            {c.adminNotes && <div className="text-xs text-amber-300/80 mt-1 break-words">{c.adminNotes}</div>}
                            <div className="text-xs text-gray-400 mt-1">
                              Held back from all departments. Suggested department:{' '}
                              <strong className="text-gray-200">{c.suggestedDepartmentId?.name || 'None'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
                          {img ? (
                            <a href={img} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={img}
                                alt="Complaint evidence"
                                className="w-full h-48 md:h-56 object-cover rounded-2xl border border-white/10"
                              />
                            </a>
                          ) : (
                            <div className="w-full h-32 md:h-56 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs text-gray-500 font-semibold">
                              No image attached
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Decision */}
                      <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            className="input-field flex-1 min-w-0"
                            value={chosen}
                            onChange={(e) => setSelectedDept((s) => ({ ...s, [c._id]: e.target.value }))}
                          >
                            <option value="" disabled className="bg-gray-900">Select department</option>
                            {deptPerf.map((d) => (
                              <option key={d.id} value={d.id} className="bg-gray-900">
                                {d.name} ({d.code})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleDivert(c)}
                            disabled={diverting === c._id || !chosen}
                            className="px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            {diverting === c._id ? 'Routing...' : isApprove ? 'Approve & Route' : 'Divert to Department'}
                          </button>

                          <button
                            onClick={() => { setRejectingId(isRejectOpen ? null : c._id); setRejectReason(''); }}
                            className="px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 transition flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>

                        {isRejectOpen && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-3">
                            <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                              Reason shown to the citizen (optional)
                            </label>
                            <textarea
                              className="input-field resize-none"
                              rows={2}
                              placeholder="e.g. The photo does not match the complaint"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              maxLength={300}
                            />
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => handleReject(c)}
                                disabled={rejecting}
                                className="px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                className="px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fadeInUp">
              <GlassCard className="!p-6 sm:!p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Target className="w-6 h-6 text-indigo-400" /> Matrix Validation Radar</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="dept" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Radar
                      name="Resolution Metric"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="#6366f1"
                      fillOpacity={0.2}
                      dot={{ r: 4, fill: '#6366f1' }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="!p-6 sm:!p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><IndianRupee className="w-6 h-6 text-indigo-400" /> Resource Allocation Output</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={deptPerf} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="code"
                      tick={{ fill: '#d1d5db', fontSize: 11, fontWeight: 'bold' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(v) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                    />
                    <Bar dataKey="totalExpense" name="Total Expenditure" radius={[0, 6, 6, 0]} maxBarSize={30}>
                      {deptPerf.map((_, i) => (
                        <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="!p-6 sm:!p-8 lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-indigo-400" /> Historical Resolution Index Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="total" name="Total Filed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="resolved" name="Validated & Resolved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
