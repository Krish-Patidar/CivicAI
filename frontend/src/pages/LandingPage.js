import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import {
  Building2,
  Bot,
  Trophy,
  Activity,
  FileText,
  Settings,
  CheckCircle,
  ArrowRight,
  LogIn
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <PageTransition className="min-h-screen bg-background font-sans selection:bg-primary-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-xl bg-background/50 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-primary-500/50 transition-all duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                CivicAI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 font-medium hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-400 font-medium hover:text-white transition-colors">How it Works</a>
              {user ? (
                <Button
                  onClick={() => navigate(user.role === 'citizen' ? '/dashboard' : (user.role === 'cm_admin' ? '/cm' : '/department'))}
                  icon={ArrowRight}
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/login')} className="text-gray-300 font-semibold hover:text-white transition-colors flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Login
                  </button>
                  <Button onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20 pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm mb-8 text-sm font-semibold text-primary-300 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
            </span>
            Smart AI Grievance Redressal System
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Fix your city's problems <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              with a single tap.
            </span>
          </h1>

          <p className="mt-6 text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Report local issues instantly, track them in real-time, get AI-powered assistance, and earn rewards for helping maintain your neighborhood.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button onClick={() => navigate('/submit-complaint')} className="w-full sm:w-auto px-8 py-4 text-lg" icon={FileText}>
              File a Complaint
            </Button>
            <Button variant="secondary" onClick={() => navigate('/track')} className="w-full sm:w-auto px-8 py-4 text-lg" icon={Activity}>
              Track Status
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Why use CivicAI?</h2>
            <p className="text-lg text-gray-400">Experience a transparent, accountable, and next-generation grievance redressal system.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlassCard delay={0.1}>
              <div className="w-14 h-14 bg-primary-500/20 text-primary-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-primary-500/30 group-hover:scale-110 transition-transform">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Support Assistant</h3>
              <p className="text-gray-400 leading-relaxed">Our Gemini-powered chatbot helps you file complaints and fetches real-time updates directly from our database.</p>
            </GlassCard>

            <GlassCard delay={0.2}>
              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Earn Civic Rewards</h3>
              <p className="text-gray-400 leading-relaxed">Get 10 credit points for every genuinely resolved issue you report. Redeem them for real monetary rewards.</p>
            </GlassCard>

            <GlassCard delay={0.3}>
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Live Tracking</h3>
              <p className="text-gray-400 leading-relaxed">No more waiting in the dark. Track the exact status of your complaint, right down to the assigned worker.</p>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* CM's Message Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <GlassCard className="!p-8 md:!p-12 lg:!p-16 border-primary-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
            <div className="text-white/5 text-9xl font-serif absolute top-4 left-8 pointer-events-none leading-none">"</div>
            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
              {/* Photo Area */}
              <div className="flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-3xl transform rotate-3 scale-105 opacity-30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500"></div>
                <img
                  src="/images/cm.png"
                  alt="Dr. Mohan Yadav, Chief Minister"
                  className="w-56 h-56 md:w-64 md:h-64 object-cover object-top rounded-3xl shadow-2xl relative z-10 border border-white/20 grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* Message Content */}
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-sm font-bold tracking-widest uppercase text-primary-400 mb-6">A Message from the Leadership</h3>
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed mb-8 italic text-gray-200">
                  "Our goal is to create a transparent, accountable, and responsive administration. CivicAI empowers every citizen to directly participate in the development of our state. Together, we can digitally resolve every grievance and build a better tomorrow."
                </p>
                <div>
                  <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Dr. Mohan Yadav</h4>
                  <p className="text-primary-400 font-medium text-lg mt-1">Hon'ble Chief Minister, Madhya Pradesh</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How it works</h2>
            <p className="text-xl text-gray-400">Three simple steps to a better neighborhood.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl border border-primary-500/50 flex items-center justify-center text-primary-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] backdrop-blur-sm">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">File Complaint</h3>
              <p className="text-gray-400">Take a photo and describe the issue. We'll capture the exact location automatically.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary-500/50 to-transparent border-dashed"></div>
              <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl border border-primary-500/50 flex items-center justify-center text-primary-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative z-10 backdrop-blur-sm">
                <Settings className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Auto Assignment</h3>
              <p className="text-gray-400">Our system instantly routes the issue to the correct department and assigns a worker.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary-500/50 to-transparent border-dashed"></div>
              <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl border border-primary-500/50 flex items-center justify-center text-primary-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative z-10 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Resolve & Reward</h3>
              <p className="text-gray-400">Once fixed, you receive a notification and earn credit points in your wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-white">CivicAI</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} Smart Grievance Redressal System. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-semibold">
            <button onClick={() => navigate('/admin-login')} className="text-gray-500 hover:text-white transition-colors">Admin Portal</button>
            <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-white transition-colors">Citizen Login</button>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
