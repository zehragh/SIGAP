import React from 'react';
import { DashboardStats } from '../types';
import { FileText, Clock, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface KPICardsProps {
  stats: DashboardStats | null;
  onFilterStatus?: (status: string) => void;
  selectedKelurahanName?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, onFilterStatus, selectedKelurahanName }) => {
  if (!stats) return null;

  const cards = [
    {
      id: 'total',
      label: 'Total Pengaduan',
      value: stats.total,
      icon: FileText,
      numColor: 'text-slate-900',
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600',
      filterVal: ''
    },
    {
      id: 'baru',
      label: 'Pengaduan Baru',
      value: stats.baru,
      icon: Clock,
      numColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600',
      filterVal: 'Baru'
    },
    {
      id: 'diproses',
      label: 'Dalam Proses',
      value: stats.diproses + stats.menunggu_data,
      icon: RefreshCw,
      numColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
      filterVal: 'Diproses'
    },
    {
      id: 'selesai',
      label: 'Telah Selesai',
      value: stats.selesai,
      icon: CheckCircle2,
      numColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
      filterVal: 'Selesai'
    },
    {
      id: 'approval',
      label: 'Menunggu Approval',
      value: stats.menunggu_approval,
      icon: AlertTriangle,
      numColor: stats.menunggu_approval > 0 ? 'text-red-600' : 'text-slate-700',
      badgeBg: stats.menunggu_approval > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200',
      iconBg: stats.menunggu_approval > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500',
      filterVal: 'Approval'
    }
  ];

  return (
    <div className="space-y-3">
      {selectedKelurahanName && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-xs text-blue-800">
          <span>
            Filter Wilayah Active: <strong className="font-bold text-blue-900">{selectedKelurahanName}</strong>
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onFilterStatus && onFilterStatus(card.filterVal)}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-700 transition">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-3xl font-bold ${card.numColor} tracking-tight`}>{card.value}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.badgeBg}`}>
                  Berkas
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
