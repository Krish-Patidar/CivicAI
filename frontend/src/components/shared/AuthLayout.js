import React from 'react';
import { PageTransition } from '../ui/PageTransition';
import PublicNav from './PublicNav';
import MapBackdrop from './MapBackdrop';

const ACCENTS = {
  primary: { select: 'selection:bg-primary-500', blobA: 'bg-primary-500', blobB: 'bg-purple-500', pin: '#818cf8' },
  emerald: { select: 'selection:bg-emerald-500', blobA: 'bg-emerald-500', blobB: 'bg-teal-500', pin: '#34d399' },
  amber: { select: 'selection:bg-amber-500', blobA: 'bg-amber-500', blobB: 'bg-red-500', pin: '#fbbf24' }
};

// Shared shell for login, register and admin login:
// navbar, glow blobs, a faint city map and a layout that fits one screen.
// Pass `left` for the brand panel (shown from lg up). Without it the card is centred.
export default function AuthLayout({ accent = 'primary', nav, left, children }) {
  const a = ACCENTS[accent] || ACCENTS.primary;

  return (
    <PageTransition className={`relative min-h-screen flex flex-col bg-background overflow-x-hidden selection:text-white ${a.select}`}>
      <PublicNav {...nav} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-20 w-96 h-96 ${a.blobA} rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob`}></div>
        <div className={`absolute bottom-1/4 -right-20 w-96 h-96 ${a.blobB} rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000`}></div>
      </div>

      <MapBackdrop color={a.pin} />

      <main className="relative z-10 flex-1 flex items-center pt-16 sm:pt-20">
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${left ? 'grid lg:grid-cols-2 gap-8 lg:gap-12 items-center' : ''}`}>
          {left && <div className="hidden lg:block">{left}</div>}
          <div className={`w-full max-w-md mx-auto ${left ? 'lg:mr-0 lg:ml-auto' : ''}`}>
            {children}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
