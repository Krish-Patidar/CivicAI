import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Mail, Lock, Info } from 'lucide-react';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin-login', form);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      const routes = { cm_admin: '/cm', department_admin: '/department', worker: '/worker' };
      navigate(routes[data.user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center bg-background selection:bg-amber-500 selection:text-white p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <GlassCard className="!p-8 sm:!p-10 border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-red-600 rounded-2xl flex items-center justify-center text-white mb-6 drop-shadow-xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h2>
            <p className="text-gray-400 mt-2">For Department Admins & CM Office</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 text-sm text-amber-200/90 flex gap-3">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input type="email" className="input-field pl-11" placeholder="admin@grievance.gov.in"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input type="password" className="input-field pl-11" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full mt-2 !from-amber-600 !to-red-600 hover:!from-amber-500 hover:!to-red-500 shadow-amber-500/20 text-white border-white/10" variant="primary" icon={ShieldCheck}>
              Secure Login
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <div className="text-sm text-gray-400">
              Are you a citizen?{' '}
              <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                Citizen Login
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
