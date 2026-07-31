import React from 'react';
import { Building2, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-6 mt-12 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">SIGAP PRO - Kantor Pertanahan Kota Parepare</p>
            <p className="text-[11px] text-slate-500">
              Sistem Informasi Pengaduan Pertanahan — Kementerian ATR/BPN Kota Parepare
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Control Center v2.1 Production Ready</span>
          </span>
          <span>•</span>
          <span>Parepare, Sulawesi Selatan</span>
        </div>

      </div>
    </footer>
  );
};
