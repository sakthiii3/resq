import React, { useEffect, useState } from 'react';
import { Phone, Shield, Ambulance, Flame } from 'lucide-react';
import api from '../services/api';

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hardcoded eventId for MVP
    api.get('/contacts/event/default-event-id')
      .then(res => setContacts(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (category: string) => {
    switch(category) {
      case 'POLICE': return <Shield className="text-blue-600" />;
      case 'MEDICAL': return <Ambulance className="text-red-600" />;
      case 'FIRE': return <Flame className="text-orange-600" />;
      default: return <Phone className="text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Emergency Contacts</h1>
        <p className="text-slate-500">Official event responders</p>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-100 rounded-full">
                  {getIcon(contact.category)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{contact.name}</h3>
                  <p className="text-sm text-slate-500">{contact.description}</p>
                </div>
              </div>
              <a href={`tel:${contact.phone}`} className="bg-green-100 text-green-700 p-3 rounded-full hover:bg-green-200">
                <Phone size={20} />
              </a>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-slate-500 mt-10">No contacts configured.</div>
          )}
        </div>
      )}
    </div>
  );
}
