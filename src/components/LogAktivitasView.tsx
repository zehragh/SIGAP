import React from 'react';
import { ActivityLog } from '../types';
import { History, Clock, ShieldAlert, User } from 'lucide-react';

interface LogAktivitasViewProps {
  logs: ActivityLog[];
}

export const LogAktivitasView: React.FC<LogAktivitasViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">LOG AKTIVITAS & AUDIT TRAIL SISTEM</h2>
            <p className="text-xs text-slate-500">
              Pencatatan rekam jejak aktivitas penting seluruh pengguna SIGAP secara real-time
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu Log</th>
                <th className="py-2.5 px-3">Pengguna</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Aktivitas</th>
                <th className="py-2.5 px-3">Rincian Tindakan</th>
                <th className="py-2.5 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-blue-600 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3">
                    <strong className="block text-slate-800 font-bold">{log.nama_user}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">@{log.username}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{log.role}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.aktivitas === 'Approval' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      log.aktivitas === 'Penolakan' ? 'bg-red-50 text-red-600 border border-red-200' :
                      log.aktivitas === 'Input' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {log.aktivitas}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{log.detail}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 text-[10px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
