import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/shared/AuthLayout';
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
    <AuthLayout
      accent="amber"
      nav={{ cta: { label: 'Citizen Login', to: '/login' } }}
    >
      <GlassCard className="!p-6 sm:!p-8 border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.08)]">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(245,158,11,0.3)] flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin Portal</h2>
          </div>
          <p className="text-gray-400 mt-2">For Department Admins & Mayor&apos;s Office</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-5 text-sm text-amber-200/90 flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>Authorised staff only. Use the credentials issued by your office.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <div className="text-sm text-gray-400">
            Are you a citizen?{' '}
            <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
              Citizen Login
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthLayout>
  );
}
