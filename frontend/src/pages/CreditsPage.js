import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/shared/Sidebar';
import { formatDate, formatCurrency } from '../utils/helpers';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { Trophy, LayoutDashboard, PlusCircle, MapPin, Gift, ScrollText, CheckCircle2, History, TrendingUp } from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/submit-complaint', icon: PlusCircle, label: 'Submit Complaint' },
  { path: '/track', icon: MapPin, label: 'Track Complaints' },
  { path: '/credits', icon: Trophy, label: 'My Credits' },
];

export default function CreditsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => { fetchCredits(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await api.get('/users/credits');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load credits');
    } finally { setLoading(false); }
  };

  const claimReward = async () => {
    setClaiming(true);
    try {
      const res = await api.post('/users/claim-reward');
      toast.success(res.data.message);
      fetchCredits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim failed');
    } finally { setClaiming(false); }
  };

  const rewardValue = data ? Math.floor(data.credits / 100) * 100 : 0;
  const progressPercent = data ? (data.credits % 100) : 0;

  return (
    <PageTransition className="flex min-h-screen bg-background text-white selection:bg-amber-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />

      <main className="flex-1 min-w-0 px-4 pt-24 pb-28 sm:px-6 sm:pt-24 lg:p-10 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute top-0 right-0 sm:right-1/4 w-[350px] h-[350px] sm:w-[700px] sm:h-[700px] bg-amber-900/10 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[150px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 w-full space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 sm:gap-4">
              <span className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.2)] flex-shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </span>
              Civic Rewards Ledger
            </h1>
            <p className="text-gray-400 text-sm mt-3 font-medium">Earn tangible rewards by resolving civic issues in your area.</p>
          </div>

          {loading ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="skeleton h-64 rounded-3xl" />
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="skeleton h-60 sm:h-80 rounded-3xl" />
                <div className="skeleton h-60 sm:h-80 rounded-3xl" />
              </div>
            </div>
          ) : (
            <>
              {/* Credit Balance */}
              <GlassCard className="!bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 overflow-hidden relative group !p-0" hover={false}>
                <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-amber-500/10 rounded-full mix-blend-screen filter blur-[80px] group-hover:bg-amber-400/20 transition-all duration-1000 pointer-events-none"></div>

                <div className="relative p-5 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                  <div className="text-center md:text-left">
                    <div className="text-xs font-black text-amber-500 tracking-widest uppercase mb-3 sm:mb-4 flex items-center justify-center md:justify-start gap-2">
                      <TrendingUp className="w-4 h-4" /> Available Balance
                    </div>
                    <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-md mb-2">{data?.credits || 0}</div>
                    <div className="text-amber-200/50 font-bold uppercase tracking-widest text-sm">Credit Points</div>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4 w-full md:w-auto">
                    <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 md:gap-8 md:w-64">
                      <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-white truncate">{formatCurrency(data?.totalRewards || 0)}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Mined</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 flex-shrink-0"><History className="w-5 h-5 text-gray-400" /></div>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 md:gap-8 md:w-64">
                      <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-amber-400 truncate">{formatCurrency(rewardValue)}</div>
                        <div className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mt-1">Liquid Assets</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 flex-shrink-0"><Gift className="w-5 h-5 text-amber-400" /></div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Claim action */}
                <GlassCard className="!p-5 sm:!p-8 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-400" /> Claim Cycle
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                    Rewards can be withdrawn sequentially every 3 months. A minimum threshold of 100 credits is required for liquidation. Current claimable block: <strong className="text-white">{formatCurrency(rewardValue)}</strong>.
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 flex-1">
                    <div className="flex justify-between items-center gap-3 text-sm font-bold mb-3">
                      <span className="text-gray-400 uppercase tracking-wider text-[10px]">Next Milestone Progress</span>
                      <span className="text-emerald-400 flex-shrink-0">{progressPercent}/100</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-3 border border-white/5 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <Button
                    onClick={claimReward}
                    disabled={claiming || data?.credits < 100}
                    isLoading={claiming}
                    className={`w-full py-4 min-h-[52px] text-base sm:text-lg shadow-xl ${data?.credits >= 100 ? '!from-amber-500 !to-orange-600 hover:!from-amber-400 hover:!to-orange-500 shadow-amber-500/20' : 'opacity-50'}`}
                    icon={Gift}
                  >
                    Withdraw {formatCurrency(rewardValue)} Assets
                  </Button>
                </GlassCard>

                {/* Logistics */}
                <GlassCard className="!p-5 sm:!p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-indigo-400" /> Matrix Protocol
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: PlusCircle, label: 'Report Grievance', value: 'Base Action', color: 'text-gray-400' },
                      { icon: CheckCircle2, label: 'Successful Resolution', value: '+10 Credits', color: 'text-emerald-400' },
                      { icon: Trophy, label: 'Threshold: 100 Credits', value: '= ₹100 INR', color: 'text-amber-400' },
                      { icon: History, label: 'Withdrawal Cooldown', value: 'Quarterly', color: 'text-blue-400' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <item.icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="font-bold text-sm text-gray-300">{item.label}</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-black tracking-wider sm:tracking-widest uppercase whitespace-nowrap flex-shrink-0 ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* History */}
              <GlassCard className="!p-5 sm:!p-8">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" /> Protocol Ledger
                </h3>
                {(data?.history || []).length === 0 ? (
                  <div className="text-gray-500 text-sm font-medium flex-col font-mono text-center py-12 sm:py-16 flex items-center justify-center opacity-50">
                    <ScrollText className="w-12 h-12 mb-4 text-white/10" />
                    Ledger empty. Initiate actions to begin logging.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...(data?.history || [])].reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border flex-shrink-0 ${h.amount > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {h.amount > 0 ? '+' : '-'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white mb-1 tracking-wide break-words">{h.reason}</div>
                            <div className="text-xs font-mono font-medium text-gray-500">{formatDate(h.date)}</div>
                          </div>
                        </div>
                        <div className={`text-base sm:text-lg font-black tracking-wider flex-shrink-0 ${h.amount > 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
                          {h.amount > 0 ? '+' : ''}{h.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
