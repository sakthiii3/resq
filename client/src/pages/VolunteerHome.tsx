import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { MapPin, CheckCircle, AlertTriangle, ShieldCheck, X, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import api from '../services/api';

export default function VolunteerHome() {
  const { socket } = useSocket();
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [toast, setToast] = useState<{message: string, isError: boolean} | null>(null);
  const [volunteerLocation, setVolunteerLocation] = useState<[number, number] | null>(null);
  
  // Real routing state
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);

  // Continuously track volunteer location when available (with fallback for demo)
  useEffect(() => {
    if (isAvailable) {
      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => setVolunteerLocation([pos.coords.latitude, pos.coords.longitude]),
          (err) => {
            console.error("Location tracking failed, using fallback", err);
            setVolunteerLocation([10.8405, 76.2611]); // Default nearby fallback
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
      } else {
        setVolunteerLocation([10.8405, 76.2611]); // Fallback if no geolocation API
      }
    }
  }, [isAvailable]);

  // Fetch real route from OSRM when active incident is STARTED
  useEffect(() => {
    if (activeIncident && (activeIncident.currentStatus === 'STARTED' || activeIncident.currentStatus === 'ACCEPTED') && volunteerLocation && activeIncident.latitude) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${volunteerLocation[1]},${volunteerLocation[0]};${activeIncident.longitude},${activeIncident.latitude}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // OSRM returns GeoJSON coordinates as [lng, lat], Leaflet needs [lat, lng]
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRouteCoords(coords);
            
            // Format distance and duration
            const distKm = (route.distance / 1000).toFixed(1);
            const durationMin = Math.ceil(route.duration / 60);
            setRouteInfo({ distance: `${distKm} km`, duration: `${durationMin} min` });
          }
        } catch (err) {
          console.error("OSRM Routing failed", err);
        }
      };
      fetchRoute();
    } else {
      setRouteCoords([]);
      setRouteInfo(null);
    }
  }, [activeIncident?.currentStatus, volunteerLocation, activeIncident?.latitude, activeIncident?.longitude]);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (socket) {
      socket.on('incident:assigned', (incident) => {
        if (isAvailable && !activeIncident) {
          setActiveIncident({ ...incident, assignmentId: incident.assignments?.[0]?.id || "demo-id" });
        }
      });
    }
  }, [socket, isAvailable, activeIncident]);

  const updateStatus = async (status: string) => {
    try {
      await api.post(`/assignments/${activeIncident.assignmentId}/status`, { status });
      if (status === 'COMPLETED' || status === 'DECLINED') {
        setActiveIncident(null);
        showToast(`Incident ${status.toLowerCase()}`);
      } else {
        setActiveIncident({ ...activeIncident, currentStatus: status });
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to update status", true);
    }
  };

  return (
    <div className="min-h-screen bg-secondary p-4 pb-20 relative overflow-hidden">
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} />

      {/* Custom Toast */}
      {toast && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-2xl animate-fade-in ${
          toast.isError ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-green-500 text-white shadow-green-500/50'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="flex justify-between items-center mb-8 glass-card p-5 rounded-2xl relative z-10 border border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Responder <span className="text-primary">Portal</span></h1>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mt-1">Field Operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isAvailable ? 'text-green-400' : 'text-slate-500'}`}>
            {isAvailable ? 'Standby' : 'Offline'}
          </span>
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-16 h-8 flex items-center rounded-full p-1 transition-all shadow-inner ${isAvailable ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5 border border-white/10'}`}
          >
            <div className={`w-6 h-6 rounded-full shadow-md transform transition-transform ${isAvailable ? 'translate-x-8 bg-green-500 shadow-green-500/50' : 'bg-slate-500'}`}></div>
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto">
        {activeIncident ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-red-500/30 shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)] animate-fade-in">
            <div className="bg-gradient-to-r from-red-600 to-rose-800 text-white p-5">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-black flex items-center tracking-tight"><AlertTriangle className="mr-2"/> NEW DISPATCH</h2>
                <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{activeIncident.priority} PRIORITY</span>
              </div>
              <p className="opacity-90 font-medium text-sm">{activeIncident.type} Emergency</p>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Live Routing Map */}
              {(activeIncident.currentStatus === 'STARTED' || activeIncident.currentStatus === 'ACCEPTED') && activeIncident.latitude && (
                <div className="h-64 rounded-xl overflow-hidden border border-white/10 relative shadow-2xl">
                  
                  {/* Routing Overlay Info */}
                  <div className="absolute top-3 left-3 right-3 z-[400] flex justify-between items-start pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center shadow-lg">
                      <Navigation size={14} className="text-primary mr-2 animate-pulse" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Routing</span>
                    </div>
                    
                    {routeInfo && (
                      <div className="bg-gradient-to-br from-slate-900 to-black backdrop-blur-md p-2.5 rounded-lg border border-white/10 shadow-lg text-right pointer-events-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ETA</p>
                        <p className="text-xl font-black text-white leading-none text-green-400">{routeInfo.duration}</p>
                        <p className="text-xs font-bold text-slate-300 mt-1">{routeInfo.distance}</p>
                      </div>
                    )}
                  </div>

                  <MapContainer center={[activeIncident.latitude, activeIncident.longitude]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png" />
                    
                    <Marker position={[activeIncident.latitude, activeIncident.longitude]} />
                    
                    {volunteerLocation && (
                      <Marker position={volunteerLocation}>
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}

                    {/* Actual Road Polyline from OSRM, fallback to straight line if API fails */}
                    {routeCoords.length > 0 ? (
                      <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.8} />
                    ) : volunteerLocation ? (
                      <Polyline positions={[volunteerLocation, [activeIncident.latitude, activeIncident.longitude]]} color="#cc0033" weight={3} dashArray="5, 10" className="animate-pulse" />
                    ) : null}
                  </MapContainer>
                </div>
              )}

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Location Coordinates</p>
                <p className="font-bold text-white flex items-center text-sm">
                  <MapPin size={16} className="text-primary mr-2"/> 
                  {activeIncident.latitude ? `${activeIncident.latitude.toFixed(5)}, ${activeIncident.longitude.toFixed(5)}` : 'Location unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Situation Brief</p>
                <p className="text-slate-200 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{activeIncident.description}</p>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-white/10">
                {activeIncident.currentStatus === 'ACCEPTED' ? (
                  <>
                    <button onClick={() => updateStatus('STARTED')} className="flex-1 bg-amber-500/20 text-amber-500 border border-amber-500/50 py-4 rounded-xl font-bold hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-500/20 text-sm">EN ROUTE</button>
                    <button onClick={() => updateStatus('COMPLETED')} className="flex-1 bg-green-500/20 text-green-500 border border-green-500/50 py-4 rounded-xl font-bold hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/20 text-sm flex justify-center items-center"><ShieldCheck size={16} className="mr-2"/> RESOLVE</button>
                  </>
                ) : activeIncident.currentStatus === 'STARTED' ? (
                   <button onClick={() => updateStatus('COMPLETED')} className="w-full bg-green-500/20 text-green-500 border border-green-500/50 py-4 rounded-xl font-bold hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/20 text-sm flex justify-center items-center"><ShieldCheck size={18} className="mr-2"/> MARK INCIDENT SECURE</button>
                ) : (
                  <>
                    <button onClick={() => updateStatus('ACCEPTED')} className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-[0_0_20px_-5px_rgba(204,0,51,0.5)] text-sm">ACCEPT MISSION</button>
                    <button onClick={() => updateStatus('DECLINED')} className="flex-1 bg-white/5 text-slate-400 border border-white/10 py-4 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all flex justify-center items-center text-sm"><X size={16} className="mr-1"/> DECLINE</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center border border-white/5 rounded-3xl glass-card">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <CheckCircle size={64} className="text-green-500 relative z-10 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">No Active Assignments</h2>
            <p className="text-slate-400 text-sm px-8">Stay on standby. You will be alerted instantly when an emergency is routed to your sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}
