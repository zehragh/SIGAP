import React from 'react';
import { DashboardStats } from '../types';
import { PieChart, BarChart2, TrendingUp, Layers } from 'lucide-react';

interface ChartsSectionProps {
  stats: DashboardStats | null;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ stats }) => {
  if (!stats) return null;

  const total = stats.total || 1;

  // Status breakdown
  const statusItems = [
    { label: 'Baru', count: stats.baru, color: 'bg-blue-600', text: 'text-blue-600' },
    { label: 'Diproses', count: stats.diproses, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Menunggu Data', count: stats.menunggu_data, color: 'bg-purple-600', text: 'text-purple-600' },
    { label: 'Selesai', count: stats.selesai, color: 'bg-emerald-600', text: 'text-emerald-600' },
    { label: 'Ditolak', count: stats.ditolak, color: 'bg-red-600', text: 'text-red-600' }
  ];

  // Sumber Breakdown
  const sumberList = Object.entries(stats.by_sumber || {}).sort((a, b) => (b[1] as number) - (a[1] as number));

  // Kelurahan Breakdown
  const kelurahanList = Object.entries(stats.by_kelurahan || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Status Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-700 tracking-tight uppercase">Status Pengaduan</h4>
          </div>
          <div className="space-y-2.5">
            {statusItems.map((item) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className={`font-bold ${item.text}`}>{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Sumber Pengaduan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-700 tracking-tight uppercase">Sumber Kanal</h4>
          </div>
          <div className="space-y-2.5">
            {sumberList.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data kanal</p>
            ) : (
              sumberList.map(([kanal, cnt]) => {
                const count = cnt as number;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={kanal} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium truncate max-w-[130px]">{kanal}</span>
                      <span className="font-bold text-indigo-600">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Top Kelurahan Active */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-700 tracking-tight uppercase">Top Kelurahan</h4>
          </div>
          <div className="space-y-2.5">
            {kelurahanList.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data kelurahan</p>
            ) : (
              kelurahanList.map(([kel, cnt]) => {
                const count = cnt as number;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={kel} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium truncate max-w-[130px]">Kel. {kel}</span>
                      <span className="font-bold text-emerald-600">{count} berkas</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Tren Bulanan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-700 tracking-tight uppercase">Tren Pengaduan 2026</h4>
          </div>
          <div className="flex items-end justify-between h-28 pt-4 px-2">
            {Object.entries(stats.by_bulan || {}).slice(0, 7).map(([m, rawCnt]) => {
              const cnt = rawCnt as number;
              const valuesList = Object.values(stats.by_bulan || { a: 1 }) as number[];
              const maxVal = Math.max(...valuesList, 5);
              const heightPct = Math.max(15, Math.round((cnt / maxVal) * 100));
              return (
                <div key={m} className="flex flex-col items-center space-y-1 group">
                  <span className="text-[9px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">{cnt}</span>
                  <div className="w-5 bg-slate-100 rounded-t overflow-hidden flex items-end">
                    <div className="w-full bg-blue-600 rounded-t transition-all duration-500 group-hover:bg-blue-700" style={{ height: `${heightPct}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold">{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
