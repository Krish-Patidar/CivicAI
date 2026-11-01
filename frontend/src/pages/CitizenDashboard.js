import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import StatCard from '../components/shared/StatCard';
import ComplaintCard from '../components/shared/ComplaintCard';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import Chatbot from '../components/Chatbot';
import { FileText, MapPin, Trophy, LayoutDashboard, Clock, RefreshCw, CheckCircle, PlusCircle, Inbox, Activity } from 'lucide-react';


const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/submit-complaint', icon: PlusCircle, label: 'Submit Complaint' },
  { path: '/track', icon: MapPin, label: 'Track Complaints' },
  { path: '/credits', icon: Trophy, label: 'My Credits' },
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats'),
        api.get('/complaints?limit=5'),
      ]);
      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="flex min-h-screen bg-background selection:bg-primary-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-900/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-400 mt-1">Here's an overview of your civic contributions</p>
            </div>
            <Button onClick={() => navigate('/submit-complaint')} icon={PlusCircle}>
              New Complaint
            </Button>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard icon={FileText} label="Total Complaints" value={stats?.total || 0} color="blue" />
              <StatCard icon={Clock} label="Pending Review" value={stats?.pending || 0} color="orange" />
              <StatCard icon={RefreshCw} label="In Progress" value={stats?.inProgress || 0} color="purple" />
              <StatCard icon={CheckCircle} label="Resolved" value={stats?.completed || 0} color="green" />
            </div>
          )}

          {/* Credits Banner */}
          <GlassCard className="!bg-gradient-to-r !from-amber-600/20 !to-orange-600/20 !border-amber-500/30 !p-8 mb-10 overflow-hidden relative group" hover={false}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full mix-blend-screen filter blur-[50px] group-hover:bg-amber-400/30 transition-colors duration-700 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] flex-shrink-0 text-white">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold gap-2 text-white">Your Credit Points</h2>
                  <p className="text-amber-200 mt-1 font-medium">Earn 10 credits per resolved complaint</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-500 drop-shadow-sm mb-2">
                  {stats?.credits || user?.credits || 0}
                </div>
                <Button variant="outline" className="!py-2 !px-4 !text-xs !border-amber-500/50 !text-amber-400 hover:!border-amber-500 hover:!bg-amber-500/10" onClick={() => navigate('/credits')}>
                  View Ledger →
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Recent Complaints */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              Recent Complaints
            </h2>
            <button onClick={() => navigate('/track')} className="text-primary-400 text-sm font-semibold hover:text-primary-300 transition-colors hover:underline underline-offset-4">
              View All Activity →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-3xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <GlassCard className="text-center py-20 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-6 drop-shadow-xl">
                <Inbox className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">No complaints yet</h3>
              <p className="text-gray-400 mt-2 mb-8 max-w-sm">You haven't reported any issues. Help keep your city clean and safe by submitting your first complaint!</p>
              <Button onClick={() => navigate('/submit-complaint')} icon={PlusCircle}>
                Submit a Complaint
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {complaints.map(c => (
                <ComplaintCard key={c._id} complaint={c} onClick={() => navigate(`/track/${c._id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}

