import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import StatCard from '../components/shared/StatCard';
import { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { formatDateTime, getImageUrl, formatCurrency } from '../utils/helpers';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Chatbot from '../components/Chatbot';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  IndianRupee,
  MapPin,
  Eye,
  Settings,
  Save,
  Pointer
} from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: '/department', icon: Building2, label: 'Overview' },
];

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updateForm, setUpdateForm] = useState({ status: '', assignedTo: '', expense: '', adminNotes: '' });

  const fetchAll = useCallback(async () => {
  try {
    const [cRes, aRes, wRes] = await Promise.all([
      api.get('/complaints?limit=100'),
      api.get(`/departments/${user.departmentId}/analytics`),
      api.get(`/departments/${user.departmentId}/workers`),
    ]);

    setComplaints(cRes.data.complaints);
    setAnalytics(aRes.data.analytics);
    setWorkers(wRes.data.workers);
  } catch (err) {
    toast.error('Failed to load data');
  } finally {
    setLoading(false);
  }
}, [user.departmentId]);

useEffect(() => {
  fetchAll();
}, [fetchAll]);

  const selectComplaint = (c) => {
    setSelected(c);
    setUpdateForm({ status: c.status, assignedTo: c.assignedTo?._id || '', expense: c.expense || '', adminNotes: c.adminNotes || '' });
  };

  const updateComplaint = async () => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/complaints/${selected._id}`, updateForm);
      toast.success('Complaint updated!');
      setSelected(data.complaint);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const pieData = analytics ? [
    { name: 'Pending', value: analytics.byStatus.pending || 0 },
    { name: 'In Progress', value: analytics.byStatus.in_progress || 0 },
    { name: 'Completed', value: analytics.byStatus.completed || 0 },
    { name: 'Rejected', value: analytics.byStatus.rejected || 0 },
  ] : [];

  return (
    <PageTransition className="flex min-h-screen bg-background selection:bg-primary-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Department Admin" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
        {/* Background glow */}
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-indigo-900/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" /> Department Command Center
            </h1>
            <p className="text-gray-400 mt-2">Manage routing, oversee tasks, and analyze grievance resolutions</p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={FileText} label="Total Assigned" value={analytics?.total || 0} color="indigo" />
              <StatCard icon={Clock} label="Pending Action" value={analytics?.byStatus?.pending || 0} color="orange" />
              <StatCard icon={CheckCircle} label="Successfully Resolved" value={analytics?.byStatus?.completed || 0} color="green" />
              <StatCard icon={IndianRupee} label="Total Expenditure" value={formatCurrency(analytics?.totalExpense)} color="purple" />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Complaints list */}
            <div className="lg:col-span-1">
              <GlassCard className="!p-0 h-[800px] flex flex-col overflow-hidden" hover={false}>
                <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" /> Task Queue
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'in_progress', 'completed'].map(s => (
                      <button key={s} onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${filter === s ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        {s.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                  {filtered.map(c => (
                    <div key={c._id} onClick={() => selectComplaint(c)}
                      className={`p-4 mb-2 rounded-2xl cursor-pointer transition-all ${selected?._id === c._id ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-transparent border border-transparent hover:bg-white/5'}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-sm font-bold text-white line-clamp-2">{c.title}</span>
                      </div>
                      <div className="text-xs font-mono text-gray-500 mb-2">{c.complaintNumber}</div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-2">
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                        </div>
                        {c.assignedTo && <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">👷 {c.assignedTo.name.split(' ')[0]}</div>}
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <CheckCircle className="w-12 h-12 mb-3 text-white/10" />
                      <div className="text-sm font-medium">Queue is empty</div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Detail + Update panel */}
            <div className="lg:col-span-2 space-y-6">
              {!selected ? (
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-6 drop-shadow-2xl">
                    <Pointer className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Select a Task</h3>
                  <p className="text-gray-400 max-w-sm">Click on any grievance from the queue to view its details and update status.</p>
                </GlassCard>
              ) : (
                <>
                  <GlassCard className="!p-6 sm:!p-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{selected.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm font-mono text-indigo-400 font-medium">{selected.complaintNumber}</p>
                          <span className="text-gray-600">•</span>
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{formatDateTime(selected.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge status={selected.status} />
                        <PriorityBadge priority={selected.priority} />
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Description
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {selected.location?.address && (
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-rose-400"><MapPin className="w-5 h-5" /></div>
                            <div>
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</div>
                              <div className="text-sm text-gray-300 mt-1">{selected.location.address}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
                          <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Citizen Reporter</div>
                            <div className="text-sm text-gray-300 mt-1 font-semibold">{selected.citizenId?.name}</div>
                          </div>
                        </div>
                      </div>

                      {selected.image && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative h-40 group">
                          <img src={getImageUrl(selected.image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-3">
                            <span className="text-xs font-bold text-white flex items-center gap-1"><Eye className="w-3 h-3" /> Visual Proof</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Update form */}
                  <GlassCard className="!p-6 sm:!p-8 border-indigo-500/20">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-indigo-400" /> Update Task Status
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status Phase</label>
                        <select className="input-field !bg-background !border-white/10" value={updateForm.status}
                          onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assign Worker</label>
                        <select className="input-field !bg-background !border-white/10" value={updateForm.assignedTo}
                          onChange={e => setUpdateForm({ ...updateForm, assignedTo: e.target.value })}>
                          <option value="">— Unassigned —</option>
                          {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expense (₹)</label>
                        <input type="number" className="input-field !bg-background !border-white/10" placeholder="0"
                          value={updateForm.expense} onChange={e => setUpdateForm({ ...updateForm, expense: e.target.value })} />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Operational Notes</label>
                      <textarea className="input-field !bg-background !border-white/10 resize-none" rows={3} placeholder="Internal audit logs, remarks..."
                        value={updateForm.adminNotes} onChange={e => setUpdateForm({ ...updateForm, adminNotes: e.target.value })} />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={updateComplaint} isLoading={updating} icon={Save}>
                        Commit Changes
                      </Button>
                    </div>
                  </GlassCard>
                </>
              )}

              {/* Analytics chart */}
              {analytics && (
                <GlassCard className="!p-6 sm:!p-8">
                  <h3 className="text-xl font-bold text-white mb-6">📊 Efficiency Analytics</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" stroke="rgba(255,255,255,0.05)" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
