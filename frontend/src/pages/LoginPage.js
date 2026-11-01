import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Building2, ClipboardList, Bot, Target, Trophy, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email & password');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}! 🎉`);

      const routes = {
        citizen: '/dashboard',
        department_admin: '/department',
        worker: '/worker',
        cm_admin: '/cm'
      };
      navigate(routes[data.user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex bg-background selection:bg-primary-500 selection:text-white">
      {/* Left panel - Decorative */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden border-r border-white/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-8">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight">CivicAI</h1>
          <p className="text-primary-200 text-xl mb-12 font-light">Smart Citizen Grievance Redressal System</p>
          
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { icon: ClipboardList, title: 'Submit Complaints', desc: 'File complaints easily with photo & location' },
              { icon: Bot, title: 'AI Classification', desc: 'Automatic routing to right department' },
              { icon: Target, title: 'Track Status', desc: 'Real-time updates on your complaints' },
              { icon: Trophy, title: 'Earn Credits', desc: 'Get rewarded for genuine reports' }
            ].map(({ icon: Icon, title, desc }) => (
              <GlassCard key={title} className="p-5" hover={false}>
                <div className="text-primary-400 mb-3"><Icon className="w-8 h-8" /></div>
                <div className="text-white font-bold mb-1">{title}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{desc}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Mobile background blob */}
        <div className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-primary-500 rounded-full mix-blend-screen filter blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <GlassCard className="!p-8 sm:!p-10 border-primary-500/20 shadow-[0_0_50px_rgba(99,102,241,0.05)]">
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary-400 mb-6 drop-shadow-xl">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-gray-400 mt-2">Sign in to your citizen account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    className="input-field pl-11"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    className="input-field pl-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" isLoading={loading} className="w-full mt-2" icon={LogIn}>
                Login to Portal
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
              <div className="text-sm text-gray-400">
                New citizen?{' '}
                <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                  Create an account
                </Link>
              </div>

              <div className="text-sm text-gray-500">
                Department or CM Admin?{' '}
                <Link to="/admin-login" className="text-gray-300 hover:text-white transition-colors underline decoration-white/30 underline-offset-4">
                  Admin Login
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
