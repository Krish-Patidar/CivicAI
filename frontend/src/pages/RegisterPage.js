import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
  Sparkles, FileText, Bot, Activity, IndianRupee, 
  UserPlus, User, Mail, Phone, Lock, CheckCircle, ArrowLeft
} from 'lucide-react';

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
      toast.success('Welcome to CivicAI! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <PageTransition className="min-h-screen flex bg-background selection:bg-emerald-500 selection:text-white">
      {/* Left panel - Decorative */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden border-r border-white/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-8">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight">Join CivicAI</h1>
          <p className="text-emerald-200 text-xl mb-12 font-light">Be a responsible citizen. Report issues, earn credits, win rewards.</p>
          
          <div className="space-y-4 text-left">
            {[
              { icon: Mail, text: 'Register in 60 seconds with email OTP' },
              { icon: FileText, text: 'Submit complaints with photo & location' },
              { icon: Bot, text: 'AI auto-classifies your complaint' },
              { icon: Activity, text: 'Track status in real-time' },
              { icon: IndianRupee, text: 'Earn ₹ rewards for genuine reports' }
            ].map(({ icon: Icon, text }, i) => (
              <GlassCard key={i} className="!p-4 flex items-center gap-4" hover={false}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-white font-medium">{text}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Mobile background blob */}
        <div className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <GlassCard className="!p-8 sm:!p-10 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 drop-shadow-xl">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="text-gray-400 mt-2">Register as a citizen — it's free!</p>
            </div>

            {step === 1 ? (
              <form onSubmit={sendOTP} className="space-y-5">
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
              <form onSubmit={register} className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400 flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <span>OTP sent to <span className="font-bold text-emerald-300">{form.email}</span></span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Enter 6-Digit OTP</label>
                  <input type="text" className="input-field text-center text-3xl tracking-[0.5em] font-black py-4"
                    placeholder="000000" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                
                <div className="space-y-3 pt-2">
                  <Button type="submit" isLoading={loading} className="w-full !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 shadow-emerald-500/20 text-white" icon={CheckCircle}>
                    Complete Registration
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-full" icon={ArrowLeft}>
                    Go Back
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <div className="text-sm text-gray-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                  Login here
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
