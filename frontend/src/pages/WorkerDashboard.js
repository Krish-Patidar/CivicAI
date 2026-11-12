import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import StatCard from '../components/shared/StatCard';
import { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { formatDateTime, CATEGORY_LABELS, getImageUrl } from '../utils/helpers';
import Chatbot from '../components/Chatbot';
import {
  HardHat,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle,
  MapPin,
  Tag,
  Save,
  Pointer,
  SearchX,
  Wrench,
  ClipboardList
} from 'lucide-react';

const SIDEBAR_LINKS = [{ path: '/worker', icon: Wrench, label: 'My Tasks' }];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [form, setForm] = useState({ status: '', workerNotes: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/workers/tasks');
      setTasks(data.complaints);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const selectTask = (t) => {
    setSelected(t);
    setForm({ status: t.status, workerNotes: t.workerNotes || '' });
  };

  // backend logic of second file kept as it is
  const updateTask = async () => {
    if (!selected?._id) {
      toast.error('Please select a task first');
      return;
    }

    setSaving(true);
    try {
            const fd = new FormData();
      fd.append('status', form.status);
      fd.append('workerNotes', form.workerNotes);
      if (proofFile) fd.append('proofImage', proofFile);
      await api.put(`/complaints/${selected._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProofFile(null);

      toast.success('Task progress updated!');
      await fetchTasks();

      const { data } = await api.get(`/complaints/${selected._id}`);
      setSelected(data.complaint);
      setForm({
        status: data.complaint.status,
        workerNotes: data.complaint.workerNotes || ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length
  };

  return (
    <PageTransition className="flex min-h-screen bg-background selection:bg-teal-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Worker Portal" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-900/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <HardHat className="w-8 h-8 text-teal-400" />
              Ground Operations
            </h1>
            <p className="text-gray-400 mt-2">
              Manage and complete your assigned civic resolution tasks
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={FileText} label="Total Assigned" value={stats.total} color="blue" />
              <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="orange" />
              <StatCard icon={RefreshCw} label="Works In Progress" value={stats.inProgress} color="purple" />
              <StatCard icon={CheckCircle} label="Completed Works" value={stats.completed} color="green" />
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <GlassCard className="!p-0 h-[800px] flex flex-col overflow-hidden border-teal-500/10" hover={false}>
                <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="font-bold text-white mb-4 text-lg">Assigned Task List</div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'in_progress', 'completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${filter === s
                          ? 'bg-teal-500 text-white shadow-teal-500/30'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {s.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton h-24 rounded-2xl" />
                    ))
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                      <SearchX className="w-12 h-12 mb-4 text-white/10" />
                      <div className="text-sm font-semibold">No assigned tasks found</div>
                    </div>
                  ) : (
                    filtered.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => selectTask(t)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border ${selected?._id === t._id
                          ? 'bg-teal-500/10 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                          : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/5'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-sm font-bold text-white line-clamp-1">
                            {t.title}
                          </span>
                          <StatusBadge status={t.status} />
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-400 font-medium">
                            {t.complaintNumber}
                          </span>
                          <PriorityBadge priority={t.priority} />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 bg-white/5 w-fit px-2.5 py-1 rounded-lg">
                          <Tag className="w-3.5 h-3.5 text-teal-400" />
                          {CATEGORY_LABELS[t.category] || t.category}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {!selected ? (
                <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-500 mb-6 shadow-xl">
                    <Pointer className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Select a Task</h3>
                  <p className="text-gray-400 max-w-sm">
                    Select a task from the list on the left to view instructions and update its progress.
                  </p>
                </GlassCard>
              ) : (
                <>
                  <GlassCard className="!p-6 sm:!p-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                          {selected.title}
                        </h2>
                        <p className="text-sm font-mono text-teal-400 font-medium">
                          {selected.complaintNumber}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge status={selected.status} />
                        <PriorityBadge priority={selected.priority} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          Category
                        </div>
                        <div className="text-sm text-gray-300 font-medium">
                          {CATEGORY_LABELS[selected.category] || selected.category}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Task Created
                        </div>
                        <div className="text-sm text-gray-300 font-medium">
                          {formatDateTime(selected.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Description / Instructions
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {selected.description}
                      </p>
                    </div>

                    {selected.location?.address && (
                      <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 text-sm text-teal-400 font-medium mb-6 flex items-start gap-3">
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-teal-500/70 font-bold uppercase tracking-wider mb-1">
                            Target Location
                          </div>
                          {selected.location.address}
                        </div>
                      </div>
                    )}

                    {selected.image && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg mb-6 max-h-80">
                        <img
                          src={getImageUrl(selected.image)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {selected.citizenId && (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">
                          {selected.citizenId.name.charAt(0)}
                        </span>
                        Reported by:{' '}
                        <span className="text-gray-300 font-medium">
                          {selected.citizenId.name}
                        </span>
                      </div>
                    )}
                  </GlassCard>

                  <GlassCard className="!p-6 sm:!p-8 border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.05)]">
                   <ClipboardList className="w-5 h-5 inline-block align-text-bottom mr-2" /> Update Work Progress

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Current Status
                      </label>
                      <select
                        className="input-field !bg-background !border-white/10"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                      <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Completion Proof Photo (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="input-field !bg-background !border-white/10"
                        onChange={(e) => setProofFile(e.target.files[0] || null)}
                      />
                      {selected.proofImage && (
                        <img src={getImageUrl(selected.proofImage)} alt="Proof" className="mt-3 rounded-xl max-h-40 object-cover border border-white/10" />
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Worker Field Notes
                      </label>
                      <textarea
                        className="input-field !bg-background !border-white/10 resize-none"
                        rows={4}
                        placeholder="Describe the materials used, labor performed, or reasons for delay..."
                        value={form.workerNotes}
                        onChange={(e) => setForm({ ...form, workerNotes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={updateTask}
                        isLoading={saving}
                        className="!from-teal-600 !to-emerald-600 hover:!from-teal-500 hover:!to-emerald-500 shadow-teal-500/20 text-white border-white/10"
                        variant="primary"
                        icon={Save}
                      >
                        Submit Update
                      </Button>
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
