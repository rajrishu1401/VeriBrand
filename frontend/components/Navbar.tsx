'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileUp,
  Sparkles,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/submit', label: 'Audit Studio', icon: Sparkles },
    { href: '/review', label: 'Review Queue', icon: CheckSquare },
    { href: '/upload', label: 'Guidelines', icon: FileUp },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    VeriBrand
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                    Enterprise
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Navigation - Segmented Control */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
