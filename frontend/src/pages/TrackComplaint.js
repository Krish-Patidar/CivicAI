import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/shared/Sidebar';
import { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import ReviewNotice from '../components/shared/ReviewNotice';
import { formatDateTime, CATEGORY_LABELS, getImageUrl } from '../utils/helpers';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { MapPin, LayoutDashboard, Trophy, PlusCircle, Pointer, CheckCircle2, Circle, SearchX, ShieldCheck, MapPinned, FileText, Wrench, Award, ArrowLeft } from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/submit-complaint', icon: PlusCircle, label: 'Submit Complaint' },
  { path: '/track', icon: MapPin, label: 'Track Complaints' },
  { path: '/credits', icon: Trophy, label: 'My Credits' },
];

const STEPS = ['pending', 'in_progress', 'completed'];

export default function TrackComplaint() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

const fetchComplaints = useCallback(async () => {
  try {
    const { data } = await api.get('/complaints?limit=50');
    setComplaints(data.complaints);

    if (id) {
      const found = data.complaints.find(c => c._id === id);

      if (found) {
        setSelected(found);
      } else {
        const res = await api.get(`/complaints/${id}`);
        setSelected(res.data.complaint);
      }
    }
  } catch (err) {
    toast.error('Failed to load complaints');
  } finally {
    setLoading(false);
  }
}, [id]);

useEffect(() => {
  fetchComplaints();
}, [fetchComplaints]);
  
  useEffect(() => {
    if (id && complaints.length > 0) {
      const found = complaints.find(c => c._id === id);
      if (found) setSelected(found);
    }
  }, [id, complaints]);

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  // Select a record and jump to top (so detail view starts at the top on phones)
  const handleSelect = (c) => {
    setSelected(c);
    window.scrollTo({ top: 0 });
  };

  const StatusTimeline = ({ status }) => (
    <div className="relative mt-6 sm:mt-8 mb-4 sm:mb-6 z-10">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full -z-10" />
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const idx = STEPS.indexOf(status);
          const done = i <= idx && status !== 'rejected';
          const active = i === idx && status !== 'rejected';

          return (
            <div key={s} className="flex flex-col items-center relative group">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${done ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-primary-500/30' : 'bg-background border-2 border-white/10 text-gray-500 group-hover:border-white/30'}`}>
                {done ? <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? 'animate-pulse' : ''}`} /> : <Circle className="w-4 h-4" />}
              </div>
              <div className={`mt-2 sm:mt-3 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-center whitespace-nowrap ${done ? 'text-white' : 'text-gray-500'}`}>
                {s.replace('_', ' ')}
              </div>
              {/* Progress Line fill */}
              {i > 0 && done && (
                <div className="absolute right-1/2 top-5 sm:top-6 h-1 bg-gradient-to-r from-primary-600 to-indigo-500 -translate-y-1/2 -z-10 transition-all duration-1000" style={{ width: '200%', right: '50%' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <PageTransition className="flex min-h-screen bg-background text-white selection:bg-primary-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />

      <main className="flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden relative pt-16 lg:pt-0">
        <div className="absolute top-1/4 left-1/4 w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] bg-primary-900/10 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[150px] pointer-events-none"></div>

        {/* List Panel — on mobile it is hidden once a record is opened */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-[400px] flex-shrink-0 lg:border-r border-white/10 bg-background/50 backdrop-blur-xl flex-col z-20`}>
          <div className="p-4 sm:p-6 border-b border-white/5">
            <h2 className="font-black text-xl sm:text-2xl text-white mb-4 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" /> My Tracker
            </h2>
            {/* Chips scroll sideways on phones instead of wrapping into 3 rows */}
            <div className="flex gap-2 flex-nowrap overflow-x-auto lg:flex-wrap -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 pb-1 lg:pb-0 custom-scrollbar">
              {['all', 'pending', 'in_progress', 'completed', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-4 py-2.5 min-h-[40px] flex-shrink-0 whitespace-nowrap rounded-xl text-xs font-bold transition-all shadow-sm ${filter === s ? 'bg-primary-600 text-white shadow-primary-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {s === 'all' ? 'All Records' : s.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-28 lg:pb-4 space-y-3 custom-scrollbar">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-500 flex flex-col items-center">
                <SearchX className="w-12 h-12 mb-4 text-white/5" />
                <p className="font-semibold text-sm">No complaints found</p>
              </div>
            ) : (
              filtered.map(c => (
                <div key={c._id} onClick={() => handleSelect(c)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${selected?._id === c._id ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] lg:scale-[1.02]' : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10 active:bg-white/10'}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="font-bold text-sm text-white line-clamp-1 min-w-0">{c.title}</div>
                    <StatusBadge status={c.status} needsReview={c.needsReview} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <span className="font-mono text-primary-400">{c.complaintNumber}</span>
                    <span>•</span>
                                        <span className="truncate">
                      {c.needsReview && c.status !== 'rejected' ? 'Under Review' : (CATEGORY_LABELS[c.category] || c.category)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel — on mobile it only shows once a record is opened */}
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 relative z-10 custom-scrollbar`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center opacity-50">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-2xl">
                <Pointer className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a Record</h2>
              <p className="text-gray-400 max-w-sm">Choose a grievance from your tracker list to view its complete resolution status.</p>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto animate-fadeInUp space-y-4 sm:space-y-6">
              {/* Mobile-only back button */}
              <button onClick={() => setSelected(null)}
                className="lg:hidden inline-flex items-center gap-2 min-h-[44px] -ml-1 px-3 rounded-xl bg-white/5 active:bg-white/10 text-sm font-bold text-gray-300">
                <ArrowLeft className="w-4 h-4" /> All records
              </button>

              <div className="flex items-start justify-between flex-col md:flex-row gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words">{selected.title}</h1>
                  <p className="text-sm font-mono text-primary-400 mt-2 font-bold tracking-wider break-all">{selected.complaintNumber}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={selected.status} needsReview={selected.needsReview} />
                  <PriorityBadge priority={selected.priority} />
                </div>
              </div>

              {/* Under review / rejected message */}
              <ReviewNotice complaint={selected} />

              <GlassCard className="!p-4 sm:!p-8 !bg-white/[0.02] border-primary-500/10">
                <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resolution Matrix
                </h3>
                <StatusTimeline status={selected.status} />
              </GlassCard>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <GlassCard className="!p-4 border-t-2 border-t-primary-500 min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Category</div>
                                    <div className="text-sm font-bold text-white truncate">
                    {selected.needsReview && selected.status !== 'rejected'
                      ? 'Under Review'
                      : (CATEGORY_LABELS[selected.category] || selected.category)}
                  </div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-purple-500 min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Assigned Unit</div>
                  <div className="text-sm font-bold text-white truncate">
                    {selected.needsReview
                      ? 'Under Review'
                      : selected.status === 'rejected'
                        ? 'Not assigned'
                        : (selected.departmentId?.name || 'In Routing...')}
                  </div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-emerald-500 min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Logged Date</div>
                  <div className="text-sm font-bold text-white truncate">{formatDateTime(selected.createdAt).split(',')[0]}</div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-rose-500 min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{selected.completedAt ? 'Resolved Date' : 'Target Date'}</div>
                  <div className="text-sm font-bold text-white truncate">{selected.completedAt ? formatDateTime(selected.completedAt).split(',')[0] : 'Pending'}</div>
                </GlassCard>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6">
                  <GlassCard className="!p-5 sm:!p-6 h-full">
                    <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Description details
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed break-words">{selected.description}</p>
                  </GlassCard>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {selected.location?.address && (
                    <GlassCard className="!p-5 sm:!p-6">
                      <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-amber-400" /> GPS Coordinates
                      </h4>
                      <p className="text-white font-medium text-sm break-words">{selected.location.address}</p>
                    </GlassCard>
                  )}

                  {selected.image && (
                    <GlassCard className="!p-0 overflow-hidden group">
                      <div className="p-4 bg-background/50 border-b border-white/5 flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Visual Proof</span>
                      </div>
                      <img src={getImageUrl(selected.image)} alt="complaint" className="w-full h-48 object-cover lg:group-hover:scale-105 transition-transform duration-700" />
                    </GlassCard>
                  )}
                </div>
              </div>

              {selected.workerNotes && (
                <GlassCard className="!p-5 sm:!p-6 !bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                  <h4 className="text-xs font-black text-emerald-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Official Resolution Notes
                  </h4>
                  <p className="text-emerald-100 text-sm font-medium leading-relaxed break-words">{selected.workerNotes}</p>
                </GlassCard>
              )}

              {selected.status === 'completed' && selected.isGenuine && (
                <GlassCard className="!p-6 sm:!p-8 text-center !bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 overflow-hidden relative group">
                  <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-500/20 rounded-full mix-blend-screen filter blur-[40px] group-hover:bg-amber-400/30 transition-all duration-1000"></div>
                  <Award className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Civic Duty Verified!</h3>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-2">+10 Credits Awarded</div>
                  <p className="text-amber-200/80 text-sm font-medium">Your actions improved the community. Reward points have been added to your ledger.</p>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
