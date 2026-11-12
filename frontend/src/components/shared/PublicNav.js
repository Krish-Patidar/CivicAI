import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../ui/Button';

// Top bar for the public pages (login, register, admin login).
// links: [{ label, to }] shown from md up. cta: { label, to } shown as a button.
export default function PublicNav({ links = [], cta }) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/50 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-primary-500/50 transition-all duration-300">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">CivicAI</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="hidden sm:inline text-gray-400 font-medium hover:text-white transition-colors">
            Home
          </Link>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hidden md:inline text-gray-400 font-medium hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          {cta && (
            <Button onClick={() => navigate(cta.to)} className="!py-2 !px-4 !text-sm">
              {cta.label}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
