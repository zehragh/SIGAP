import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { KelurahanMaster, Pengaduan, User } from '../types';
import { MapPin, Filter, RotateCcw, Lock } from 'lucide-react';

interface MapComponentProps {
  kelurahanList: KelurahanMaster[];
  pengaduanList: Pengaduan[];
  onSelectKelurahan: (kelurahanId: string | null, kelurahanName: string | null) => void;
  selectedKelurahanId: string | null;
  currentUser?: User | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  kelurahanList,
  pengaduanList,
  onSelectKelurahan,
  selectedKelurahanId,
  currentUser
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const isOperatorKelurahan = currentUser?.role === 'Operator Kelurahan';
  const assignedKelurahanName = currentUser?.kelurahan_nama || '';

  // Center on Kota Parepare or Assigned Kelurahan
  const PAREPARE_CENTER: [number, number] = [-4.025, 119.628];
  const DEFAULT_ZOOM = isOperatorKelurahan ? 15 : 13;

  // Filter kelurahans to display: if operator kelurahan, only show assigned kelurahan
  const displayKelurahanList = isOperatorKelurahan && assignedKelurahanName
    ? kelurahanList.filter(k => k.nama.toLowerCase() === assignedKelurahanName.toLowerCase() || k.id === currentUser?.kelurahan_id)
    : kelurahanList;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Find initial center
    let initialCenter: [number, number] = PAREPARE_CENTER;
    if (isOperatorKelurahan && displayKelurahanList.length > 0) {
      initialCenter = [displayKelurahanList[0].lat, displayKelurahanList[0].lng];
    }

    if (!mapInstanceRef.current) {
      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Dark Matter / Voyager Map Tiles for sleek professional dark theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Fly to assigned kelurahan if operator
    if (isOperatorKelurahan && displayKelurahanList.length > 0) {
      map.setView([displayKelurahanList[0].lat, displayKelurahanList[0].lng], 15);
    }

    // Render centroid markers for filtered Kelurahans
    displayKelurahanList.forEach((kel) => {
      // Filter complaints for this kelurahan (includes complaints entered by Kantah or by Kelurahan operator)
      const kelComplaints = pengaduanList.filter(
        p => p.kelurahan_id === kel.id || p.kelurahan_nama.toLowerCase() === kel.nama.toLowerCase()
      );

      const waitingApprovalCount = kelComplaints.filter(p => p.status_approval === 'Menunggu').length;
      const activeCount = kelComplaints.filter(
        p => p.status_approval === 'Disetujui' && (p.status_pengaduan === 'Baru' || p.status_pengaduan === 'Diproses' || p.status_pengaduan === 'Menunggu Data')
      ).length;
      const doneCount = kelComplaints.filter(p => p.status_pengaduan === 'Selesai').length;

      // Marker status logic according to Master Prompt rules:
      // 🟢 Hijau = Seluruh pengaduan selesai (or 0 active)
      // 🔴 Berkedip = Masih terdapat pengaduan aktif (Baru/Diproses/Menunggu Data)
      // 🟡 Kuning = Masih terdapat pengaduan yang menunggu approval
      let markerClass = 'marker-green-done';
      if (activeCount > 0) {
        markerClass = 'marker-red-blinking';
      } else if (waitingApprovalCount > 0) {
        markerClass = 'marker-yellow-waiting';
      }

      const icon = L.divIcon({
        className: 'custom-map-marker-wrap',
        html: `<div class="${markerClass} w-7 h-7 flex items-center justify-center text-[11px] font-black text-white shadow-xl cursor-pointer ring-2 ring-white">
                ${activeCount > 0 ? activeCount : (waitingApprovalCount > 0 ? '!' : '✓')}
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([kel.lat, kel.lng], { icon });

      // Build popup content
      const popupHtml = `
        <div class="p-2.5 min-w-[220px] text-slate-800">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
            <div>
              <h4 class="font-extrabold text-sm text-blue-600">Kel. ${kel.nama}</h4>
              <p class="text-[10px] text-slate-500">Kec. ${kel.kecamatan} • Kota Parepare</p>
            </div>
            ${isOperatorKelurahan ? '<span class="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">Wilayah Anda</span>' : ''}
          </div>
          
          <div class="space-y-1 text-xs mb-3">
            <div class="flex justify-between text-slate-600">
              <span>Pengaduan Aktif:</span>
              <strong class="text-red-600 font-bold">${activeCount}</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Menunggu Approval:</span>
              <strong class="text-amber-600 font-bold">${waitingApprovalCount}</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Selesai:</span>
              <strong class="text-emerald-600 font-bold">${doneCount}</strong>
            </div>
          </div>

          <button 
            id="btn-filter-${kel.id}"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow transition"
          >
            Tampilkan Pengaduan Kel. ${kel.nama}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-filter-${kel.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectKelurahan(kel.id, kel.nama);
            marker.closePopup();
          };
        }
      });

      markersLayer.addLayer(marker);
    });

  }, [kelurahanList, pengaduanList, onSelectKelurahan, isOperatorKelurahan, assignedKelurahanName]);

  // Center map on selected kelurahan if changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedKelurahanId) return;
    const selected = kelurahanList.find(k => k.id === selectedKelurahanId);
    if (selected) {
      mapInstanceRef.current.flyTo([selected.lat, selected.lng], 15, { duration: 1 });
    }
  }, [selectedKelurahanId, kelurahanList]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">PETA SEBARAN PENGADUAN PERTANAHAN</h3>
              {isOperatorKelurahan && (
                <span className="bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Terkunci: Kel. {assignedKelurahanName}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isOperatorKelurahan 
                ? `Peta terpusat khusus wilayah tugas Kelurahan ${assignedKelurahanName}. Pengaduan dari Kantah & Kelurahan otomatis sinkron.` 
                : 'Titik Centroid 22 Kelurahan di 4 Kecamatan Kota Parepare'}
            </p>
          </div>
        </div>

        {/* Legend & Filter reset */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-600 text-[10px] font-medium">Aktif</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 text-[10px] font-medium">Menunggu Approval</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 text-[10px] font-medium">Selesai</span>
          </div>

          {!isOperatorKelurahan && selectedKelurahanId && (
            <button
              onClick={() => {
                onSelectKelurahan(null, null);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(PAREPARE_CENTER, DEFAULT_ZOOM);
                }
              }}
              className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[380px] rounded-xl overflow-hidden border border-slate-200 z-10 shadow-inner"
      />
    </div>
  );
};
