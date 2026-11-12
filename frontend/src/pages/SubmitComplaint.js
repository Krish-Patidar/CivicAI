import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/shared/Sidebar';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, MapPin, Search, Camera, X, Scan, Zap, Send, FileCode2, LayoutDashboard, Trophy, AlertTriangle } from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/submit-complaint', icon: PlusCircle, label: 'Submit Complaint' },
  { path: '/track', icon: MapPin, label: 'Track Complaints' },
  { path: '/credits', icon: Trophy, label: 'My Credits' },
];

export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [form, setForm] = useState({ title: '', description: '', address: '', lat: '', lng: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setForm(f => ({ ...f, address: data.display_name || `${latitude}, ${longitude}` }));
          toast.success('Location detected!');
        } catch {
          setForm(f => ({ ...f, address: `${latitude}, ${longitude}` }));
        }
        setLocating(false);
      },
      () => { toast.error('Could not get location'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description are required');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      if (image) formData.append('image', image);

      const { data } = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAiResult({ category: data.complaint.category, priority: data.complaint.priority, id: data.complaint.complaintNumber, needsReview: !!data.complaint.needsReview, fraudCheck: data.fraudCheck || null });
toast.success(`Complaint submitted! ID: ${data.complaint.complaintNumber}`);

if (data.fraudCheck) {
  toast(data.fraudCheck.label === 'fraud'
    ? 'Your complaint was flagged as possibly fraudulent'
    : 'Your complaint was flagged for closer review', { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, duration: 6000 });
}

setTimeout(() => navigate('/track'), data.fraudCheck ? 12000 : 3000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (aiResult) {
    return (
      <PageTransition className="flex min-h-screen bg-background text-white selection:bg-primary-500 selection:text-white">
        <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />
        <main className="flex-1 min-w-0 flex items-center justify-center p-4 pt-24 pb-10 sm:p-6 sm:pt-24 lg:pt-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] bg-primary-900/20 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[120px] pointer-events-none"></div>

          <GlassCard className="text-center max-w-lg w-full p-6 sm:p-10 animate-fadeInUp shadow-[0_0_50px_rgba(99,102,241,0.1)]">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Transmission Successful</h2>
                        <p className="text-gray-400 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              {aiResult.needsReview
                ? 'Your complaint is under review before it goes to a department.'
                : aiResult.fraudCheck
                    ? 'Your complaint was submitted, but our automated check flagged it.'
                    : 'CivicAI has classified and routed your issue.'}
            </p>

            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 text-left">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 min-w-0">
                <FileCode2 className="w-6 h-6 text-primary-400 mb-3" />
                <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Classification</div>
                  <div className="font-bold text-white uppercase text-base sm:text-lg break-words">{aiResult.needsReview ? 'Under Review' : aiResult.category}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 min-w-0">
                <Zap className="w-6 h-6 text-rose-400 mb-3" />
                <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Priority Level</div>
                <div className={`font-bold uppercase text-base sm:text-lg ${aiResult.priority === 'high' ? 'text-rose-400' : aiResult.priority === 'low' ? 'text-emerald-400' : 'text-amber-400'}`}>{aiResult.priority}</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl py-3 px-4 flex items-center justify-between gap-3 mb-6 sm:mb-8">
              <span className="text-sm font-semibold text-gray-400 flex-shrink-0">Tracking Code</span>
              <span className="text-primary-400 font-mono font-bold text-sm sm:text-base break-all text-right">{aiResult.id}</span>
            </div>

                        {aiResult.needsReview && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-200 text-left mb-6 sm:mb-8">
                We found something that needs a closer look. After the review, your complaint will either be forwarded to the respective department or rejected.
              </div>
            )}

            {aiResult.fraudCheck && (
  <div className={`rounded-xl p-3 text-sm text-left mb-6 sm:mb-8 border ${aiResult.fraudCheck.label === 'fraud' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
    <div className="font-bold mb-1">
      {aiResult.fraudCheck.label === 'fraud' ? 'Flagged as possibly fraudulent' : 'Flagged for closer review'}
    </div>
    <div>Reason: {aiResult.fraudCheck.reason}</div>
    <div className="mt-1">
      {aiResult.fraudCheck.label === 'fraud'
        ? `${aiResult.fraudCheck.creditsDeducted} credits were deducted. `
        : 'No credits were deducted. '}
      The complaint was still submitted and the reviewing staff can see this flag.
    </div>
    <button type="button" onClick={() => navigate('/track')} className="mt-3 underline font-semibold">
      Go to Track Complaints
    </button>
  </div>
)}

            <div className="text-sm font-semibold text-gray-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              Initializing tracking matrix...
            </div>
          </GlassCard>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex min-h-screen bg-background text-white selection:bg-primary-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />

      <main className="flex-1 min-w-0 px-4 pt-24 pb-28 sm:px-6 sm:pt-24 lg:p-10 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-primary-900/10 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[150px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10 w-full">
          <div className="mb-6 sm:mb-10 text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
              <span className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"><PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" /></span>
              File Grievance
            </h1>
            <p className="text-gray-400 text-sm mt-3 max-w-xl font-medium">Contribute to a better city. Detail the issue and our AI matrix will automatically route it to the appropriate municipal department.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <GlassCard className="!p-4 sm:!p-8">
              <div className="space-y-5 sm:space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject Header *</label>
                  <input className="input-field" placeholder="e.g., Deep pothole on MG Road near transit hub"
                    autoComplete="off" enterKeyHint="next"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-end mb-2 gap-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Detailed Description *</label>
                    <span className="text-xs text-primary-500 font-bold flex items-center gap-1.5 flex-shrink-0"><Scan className="w-3.5 h-3.5" /> AI Parsed</span>
                  </div>
                  <textarea className="input-field resize-none" rows={5}
                    placeholder="Provide explicit details including exact metrics, duration of issue, and surrounding landmarks..."
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Coordinates / Address *</label>
                  <div className="flex flex-col sm:flex-row gap-3 relative">
                    <div className="relative flex-1 min-w-0">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input className="input-field !pl-11 border-white/10 hover:border-white/20 focus:border-primary-500" placeholder="Address or distinct landmark"
                        value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <Button type="button" onClick={detectLocation} isLoading={locating} variant="outline" className="w-full sm:w-36 min-h-[48px] flex items-center justify-center gap-2 border-white/20 text-white hover:bg-white/5">
                      <Search className="w-4 h-4" /> Locate
                    </Button>
                  </div>
                  {form.lat && form.lng && (
                    <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mt-3 flex items-center gap-2 flex-wrap break-all">
                      <Zap className="w-4 h-4 flex-shrink-0" /> <span>Lat: {form.lat} | Lng: {form.lng}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="!p-4 sm:!p-8">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Visual Evidence (Optional)
                </label>
                {preview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={preview} alt="Preview" className="w-full h-48 sm:h-64 object-cover lg:group-hover:scale-105 transition-transform duration-700" />

                    {/* Touch devices: always-visible remove button (no hover on phones) */}
                    <button type="button" aria-label="Remove image" onClick={() => { setImage(null); setPreview(null); }}
                      className="lg:hidden absolute top-3 right-3 bg-rose-500 active:bg-rose-600 text-white rounded-full w-11 h-11 flex items-center justify-center shadow-xl">
                      <X className="w-5 h-5" />
                    </button>

                    {/* Desktop: original hover overlay */}
                    <div className="hidden lg:flex absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center backdrop-blur-sm">
                      <button type="button" aria-label="Remove image" onClick={() => { setImage(null); setPreview(null); }}
                        className="bg-rose-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-rose-600 hover:scale-110 transition-all shadow-xl">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current.click()}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-10 text-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 active:bg-primary-500/5 transition-all group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 group-hover:text-primary-400 transition-colors" />
                    </div>
                    <p className="text-white font-bold text-base sm:text-lg mb-1">Upload Photographic Evidence</p>
                    <p className="text-gray-500 text-xs font-semibold">JPG, PNG, WebP format (Max 5MB)</p>
                  </div>
                )}
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </GlassCard>

            <div className="flex justify-end pt-2 sm:pt-4">
              <Button type="submit" isLoading={loading} icon={Send} className="w-full sm:w-auto sm:px-12 py-4 min-h-[52px] shadow-[0_0_30px_rgba(99,102,241,0.3)] text-base sm:text-lg">
                Transmit Grievance
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
