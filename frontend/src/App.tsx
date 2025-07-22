import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Detail from './pages/Detail';
import Results from './pages/Results';
import Confirmation from './pages/Confirmation';
import './app.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservas" element={<Dashboard />} /> {/* reutiliza Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/results" element={<Results />} />
          <Route path="/hotel/:id" element={<Detail />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
