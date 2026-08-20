import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, ShieldAlert, Crosshair, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{message: string, isError: boolean} | null>(null);
  const [incidentData, setIncidentData] = useState({
    type: 'Medical',
    description: '',
    affectedPeople: 1,
    reporterName: '',
    reporterPhone: ''
  });

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSos = () => {
    setLoading(true);
    
    const sendSos = async (lat = 10.8505, lng = 76.2711, acc = 100) => {
      try {
        await api.post('/incidents', {
          eventId: "default-event-id",
          isSos: true,
          latitude: lat,
          longitude: lng,
          locationAccuracy: acc,
        });
        showToast("SOS Triggered! Responders notified.");
      } catch (error) {
        console.error(error);
        showToast("Failed to send SOS.", true);
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => sendSos(position.coords.latitude, position.coords.longitude, position.coords.accuracy),
        () => sendSos() // fallback coordinates
      );
    } else {
      sendSos(); // fallback coordinates
    }
  };

  const submitIncidentForm = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sendForm = async (lat = 10.8505, lng = 76.2711, acc = 100) => {
      try {
        await api.post('/incidents', {
          eventId: "default-event-id",
          isSos: false,
          type: incidentData.type,
          description: incidentData.description,
          affectedPeople: incidentData.affectedPeople,
          reporterName: incidentData.reporterName,
          reporterPhone: incidentData.reporterPhone,
          latitude: lat,
          longitude: lng,
          locationAccuracy: acc,
        });
        showToast("Incident Reported Successfully!");
        setShowForm(false);
      } catch (error) {
        console.error(error);
        showToast("Failed to report.", true);
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => sendForm(position.coords.latitude, position.coords.longitude, position.coords.accuracy),
        () => sendForm()
      );
    } else {
      sendForm();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} />

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-2xl animate-fade-in ${
          toast.isError ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-green-500 text-white shadow-green-500/50'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="z-10 w-full max-w-lg px-6 flex flex-col items-center">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-16 animate-float">
          <div className="p-3 bg-gradient-to-br from-primary to-rose-700 rounded-2xl shadow-lg shadow-primary/30">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">ResQ <span className="text-primary">Kerala</span></h1>
            <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Emergency Protocol Platform</p>
          </div>
        </div>

        {!showForm ? (
          <div className="flex flex-col items-center w-full">
            {/* The Big SOS Button */}
            <div className="relative mb-16 group cursor-pointer" onClick={handleSos}>
              {/* Radar Rings */}
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-radar-ping"></div>
              <div className="absolute inset-0 rounded-full bg-primary/40 animate-radar-ping" style={{ animationDelay: '0.5s' }}></div>
              
              <button 
                disabled={loading}
                className="relative z-10 w-64 h-64 rounded-full bg-gradient-to-br from-[#ff2a5f] to-[#cc0033] text-white neon-glow flex flex-col items-center justify-center space-y-2 transform transition-transform duration-300 group-hover:scale-105 active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader className="animate-spin mb-2" size={56} /> : <AlertCircle size={56} strokeWidth={2.5} />}
                <span className="text-3xl font-black tracking-widest">{loading ? 'SENDING' : 'SOS'}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-rose-200">Hold to activate</span>
              </button>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col space-y-4">
              <button onClick={() => setShowForm(true)} className="w-full glass-card py-4 rounded-xl font-bold text-white flex items-center justify-center space-x-2 hover:bg-white/10 transition-colors">
                <Crosshair size={20} className="text-primary" />
                <span>Report Specific Incident</span>
              </button>
              
              <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl font-bold text-slate-400 flex items-center justify-center space-x-2 hover:text-white transition-colors">
                <span>Responder / Organizer Login</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitIncidentForm} className="w-full glass-card p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-500"></div>
            
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
              <AlertCircle className="text-primary mr-2" /> Report Details
            </h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input 
                    type="text" required
                    value={incidentData.reporterName}
                    onChange={(e) => setIncidentData({...incidentData, reporterName: e.target.value})}
                    placeholder="e.g. Rahul"
                    className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone No.</label>
                  <input 
                    type="tel" required
                    value={incidentData.reporterPhone}
                    onChange={(e) => setIncidentData({...incidentData, reporterPhone: e.target.value})}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Type</label>
                <select 
                  value={incidentData.type}
                  onChange={(e) => setIncidentData({...incidentData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option className="bg-secondary">Medical</option>
                  <option className="bg-secondary">Fire</option>
                  <option className="bg-secondary">Missing Person</option>
                  <option className="bg-secondary">Crowd</option>
                  <option className="bg-secondary">Infrastructure</option>
                  <option className="bg-secondary">Security</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea 
                  required
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({...incidentData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600 resize-none"
                  rows={3}
                  placeholder="Provide precise details..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">People Affected</label>
                <input 
                  type="number" min="1"
                  value={incidentData.affectedPeople}
                  onChange={(e) => setIncidentData({...incidentData, affectedPeople: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-[#cc0033] text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all">
                  {loading ? 'Submitting...' : 'Send Alert'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-slate-800 text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
