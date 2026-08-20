import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VolunteerHome from './pages/VolunteerHome';
import Contacts from './pages/Contacts';

function App() {
  return (
    <SocketProvider>
      <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/volunteer" element={<VolunteerHome />} />
        <Route path="/contacts" element={<Contacts />} />
      </Routes>
    </Router>
    </SocketProvider>
  );
}

export default App;
