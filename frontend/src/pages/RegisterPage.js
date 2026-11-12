import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/shared/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import {
  FileText, Bot, Activity, Ticket,
  UserPlus, User, Mail, Phone, Lock, CheckCircle, ArrowLeft
} from 'lucide-react';

const PERKS = [
  { icon: Mail, text: 'Register in 60 seconds with email OTP' },
  { icon: FileText, text: 'Submit complaints with photo & location' },
  { icon: Bot, text: 'AI sends it to the right department' },
  { icon: Activity, text: 'Track status in real-time' },
  { icon: Ticket, text: 'Earn credits and redeem vouchers' }
];

const brandPanel = (
  <div className="max-w-lg">
    <h1 className="text-5xl xl:text-6xl font-black text-white mb-4 tracking-tight">Join CivicAI</h1>
    <p className="text-emerald-200 text-xl mb-8 font-light">Be a responsible citizen. Report issues, earn credits, redeem vouchers.</p>

    <div className="space-y-3">
      {PERKS.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-white font-medium text-sm">{text}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email, name: form.name, password: form.password, purpose: 'register' });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const register = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, otp });
      login(data.token, data.user);
      toast.success('Welcome to CivicAI!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      accent="emerald"
      nav={{ cta: { label: 'Login', to: '/login' } }}
      left={brandPanel}
    >
      <GlassCard className="!p-6 sm:!p-8 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.08)]">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Account</h2>
          </div>
          <p className="text-gray-400 mt-2">Register as a citizen — it's free!</p>
        </div>

        {step === 1 ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <User className="w-5 h-5" />
                </div>
                <input className="input-field pl-11" placeholder="Arjun Sharma" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input type="email" className="input-field pl-11" placeholder="arjun@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Phone className="w-5 h-5" />
                </div>
                <input type="tel" className="input-field pl-11" placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input type="password" className="input-field pl-11" placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full mt-2 !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 shadow-emerald-500/20 text-white" variant="primary" icon={Mail}>
              Send OTP to Email
            </Button>
          </form>
        ) : (
          <form onSubmit={register} className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400 flex items-center gap-3">
              <Mail className="w-5 h-5 flex-shrink-0" />
              <span className="min-w-0 break-words">OTP sent to <span className="font-bold text-emerald-300">{form.email}</span></span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Enter 6-Digit OTP</label>
              <input type="text" className="input-field text-center text-3xl tracking-[0.5em] font-black py-4"
                placeholder="000000" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>

            <div className="space-y-3 pt-1">
              <Button type="submit" isLoading={loading} className="w-full !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 shadow-emerald-500/20 text-white" icon={CheckCircle}>
                Complete Registration
              </Button>
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-full" icon={ArrowLeft}>
                Go Back
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <div className="text-sm text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Login here
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthLayout>
  );
}
