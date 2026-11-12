import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/shared/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Building2, ClipboardList, Bot, Target, Trophy, Mail, Lock, LogIn } from 'lucide-react';

const FEATURES = [
  { icon: ClipboardList, title: 'Submit Complaints', desc: 'File complaints easily with photo & location' },
  { icon: Bot, title: 'AI Routing', desc: 'Your photo and text decide the right department' },
  { icon: Target, title: 'Track Status', desc: 'Real-time updates on your complaints' },
  { icon: Trophy, title: 'Earn Credits', desc: 'Redeem your credits for vouchers' }
];

const brandPanel = (
  <div className="max-w-lg">
    <h1 className="text-5xl xl:text-6xl font-black text-white mb-4 tracking-tight">CivicAI</h1>
    <p className="text-primary-200 text-xl mb-8 font-light">Smart Citizen Grievance Redressal System</p>

    <div className="space-y-3">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm">{title}</div>
            <div className="text-gray-400 text-sm">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
      toast.success(`Welcome back, ${data.user.name}!`);

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
    <AuthLayout
      accent="primary"
      nav={{ links: [{ label: 'Admin Login', to: '/admin-login' }], cta: { label: 'Create account', to: '/register' } }}
      left={brandPanel}
    >
      <GlassCard className="!p-6 sm:!p-8 border-primary-500/20 shadow-[0_0_50px_rgba(99,102,241,0.08)]">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-primary-400 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
          </div>
          <p className="text-gray-400 mt-2">Sign in to your citizen account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

        <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-3">
          <div className="text-sm text-gray-400">
            New citizen?{' '}
            <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
              Create an account
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            Department or Mayor&apos;s Office?{' '}
            <Link to="/admin-login" className="text-gray-300 hover:text-white transition-colors underline decoration-white/30 underline-offset-4">
              Admin Login
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthLayout>
  );
}
