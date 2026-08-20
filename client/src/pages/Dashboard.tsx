import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../contexts/SocketContext';
import { X, Clock, MapPin, User, Phone, Activity } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const { socket } = useSocket();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    // Fetch existing incidents
    const fetchIncidents = async () => {
      try {
        const res = await api.get('/incidents/event/default-event-id');
        if (res.data.success) setIncidents(res.data.data);
      } catch (e) {
        console.error('Failed to fetch incidents', e);
      }
    };
    fetchIncidents();

    if (socket) {
      socket.on('incident:created', (incident) => {
        setIncidents(prev => [incident, ...prev]);
      });
      socket.on('incident:updated', (updated) => {
        setIncidents(prev => prev.map(i => i.id === updated.id ? { ...i, status: updated.status } : i));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('incident:created');
        socket.off('incident:updated');
      }
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-secondary p-8 relative overflow-hidden">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} />

      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Command <span className="text-primary">Dashboard</span></h1>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mt-1">Active Incidents & Live Map</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <div className="glass-card px-5 py-3 rounded-xl border border-white/10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Incidents</span>
            <span className="font-bold text-2xl text-white">{incidents.length}</span>
          </div>
          <div className="glass-card px-5 py-3 rounded-xl border border-primary/30 bg-primary/5">
            <span className="text-primary text-[10px] font-bold uppercase tracking-wider block">High Priority</span>
            <span className="font-bold text-2xl text-primary">{incidents.filter(i => i.priority === 'HIGH').length}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <div className="col-span-2 glass-card rounded-2xl h-[600px] overflow-hidden border border-white/10">
          <MapContainer center={[10.8505, 76.2711]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            {/* Dark Mode Map Tiles */}
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
            />
            {incidents.map((inc, i) => (
              inc.latitude && inc.longitude ? (
                <Marker 
                  key={i} 
                  position={[inc.latitude, inc.longitude]}
                  eventHandlers={{ click: () => setSelectedIncident(inc) }}
                >
                  <Popup>
                    <strong>{inc.type}</strong><br/>
                    {inc.priority} Priority
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
        
        <div className="glass-card rounded-2xl border border-white/10 p-5 flex flex-col h-[600px]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 mb-4 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div> Live Feed
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {incidents.length === 0 && (
              <div className="text-center text-slate-500 mt-10 text-sm">No active incidents</div>
            )}
            {incidents.map((inc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer cursor-pointer ${
                inc.priority === 'HIGH' ? 'border-primary/50 bg-primary/10 hover:bg-primary/20' : 
                inc.priority === 'MEDIUM' ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20' : 
                'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
              }`}>
                {inc.isPossibleDuplicate && (
                  <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Duplicate</span>
                )}
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    inc.priority === 'HIGH' ? 'text-primary' : 
                    inc.priority === 'MEDIUM' ? 'text-amber-500' : 
                    'text-green-500'
                  }`}>Priority: {inc.priority}</span>
                  {!inc.isPossibleDuplicate && <span className="text-[10px] text-slate-400">{inc.status}</span>}
                </div>
                <p className="font-bold text-white mt-1">{inc.type}</p>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">{inc.description || 'No description provided'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className={`p-6 border-b border-white/10 flex justify-between items-start ${
              selectedIncident.priority === 'HIGH' ? 'bg-gradient-to-r from-primary/30 to-rose-900/10' : 
              selectedIncident.priority === 'MEDIUM' ? 'bg-gradient-to-r from-amber-500/30 to-orange-900/10' : 
              'bg-gradient-to-r from-green-500/30 to-emerald-900/10'
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block ${
                  selectedIncident.priority === 'HIGH' ? 'bg-primary/20 text-primary border border-primary/50' : 
                  selectedIncident.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 
                  'bg-green-500/20 text-green-500 border border-green-500/50'
                }`}>
                  {selectedIncident.priority} PRIORITY
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight">{selectedIncident.type}</h2>
                <p className="text-sm text-slate-300 mt-1 flex items-center"><Activity size={14} className="mr-1"/> Status: <strong className="ml-1 text-white">{selectedIncident.status}</strong></p>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="col-span-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Situation Description</p>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedIncident.description || 'No detailed description provided by the reporter.'}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center"><MapPin size={12} className="mr-1"/> Exact Location</p>
                  <p className="text-sm text-white font-medium">
                    {selectedIncident.latitude ? `${selectedIncident.latitude.toFixed(5)}, ${selectedIncident.longitude.toFixed(5)}` : 'Location unknown'}
                  </p>
                  {selectedIncident.locationAccuracy && (
                    <p className="text-xs text-slate-500">Accuracy: ±{Math.round(selectedIncident.locationAccuracy)} meters</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center"><User size={12} className="mr-1"/> Reporter Info</p>
                  <p className="text-sm text-white font-medium">{selectedIncident.reporter?.name || 'Anonymous Public User'}</p>
                  {selectedIncident.reporter?.phone && (
                    <p className="text-sm text-slate-400 flex items-center mt-1"><Phone size={12} className="mr-1"/> {selectedIncident.reporter.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center"><Clock size={12} className="mr-1"/> Timestamp</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(selectedIncident.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Impact</p>
                  <p className="text-sm text-white font-medium">
                    {selectedIncident.affectedPeople} People Affected
                  </p>
                </div>
                {selectedIncident.isPossibleDuplicate && (
                  <div className="mt-4 inline-block bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
                    <p className="text-xs text-rose-400 font-bold">⚠️ Flagged as potential duplicate</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
              <button 
                onClick={() => setSelectedIncident(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
