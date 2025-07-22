import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelAPI } from '../services/api';
import { Hotel } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    city: '',
    checkin: '',
    checkout: '',
    guests: 2
  });

  const [userName, setUserName] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Usuario';
    setUserName(name);
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const res = await hotelAPI.getAllHotels();
      setHotels(res.data || []);
    } catch (err) {
      alert('Error al cargar hoteles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSearch = () => {
    if (!searchData.city || !searchData.checkin || !searchData.checkout) {
      alert('Completa ciudad, check-in y check-out');
      return;
    }

    if (new Date(searchData.checkin) >= new Date(searchData.checkout)) {
      alert('Check-out debe ser posterior al check-in');
      return;
    }

    // No navegamos a /results, filtramos directamente en esta página
    const filtered = hotels.filter(hotel =>
      hotel.city.toLowerCase().includes(searchData.city.toLowerCase())
    );
    setHotels(filtered);
  };

  return (
    <div style={{
      fontFamily: 'Segoe UI, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      color: '#003580'
    }}>
      {/* Header */}
<header style={{
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <h1 style={{ margin: 0 }}>🏨 Hotel Booking</h1>
  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
    <span
      onClick={() => navigate('/reservas')} // ✅ Cambio clave aquí
      style={{
        cursor: 'pointer',
        textDecoration: 'underline',
        fontWeight: 'bold',
        color: 'white',
        transition: 'color 0.2s'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#bbdefb')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
      title="Ver mis reservas"
    >
      👋 {userName}
    </span>
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      🚪 Cerrar sesión
    </button>
  </div>
</header>

      {/* Buscador */}
      <div style={{
        backgroundColor: 'white',
        padding: '40px 20px',
        maxWidth: '1000px',
        margin: '30px auto',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
          🔎 Encuentra tu hotel ideal
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '15px'
        }}>
          <input
            type="text"
            placeholder="Ciudad"
            value={searchData.city}
            onChange={(e) => setSearchData(prev => ({ ...prev, city: e.target.value }))}
            style={inputStyle}
          />

          <input
            type="date"
            value={searchData.checkin}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSearchData(prev => ({ ...prev, checkin: e.target.value }))}
            style={inputStyle}
          />

          <input
            type="date"
            value={searchData.checkout}
            min={searchData.checkin || new Date().toISOString().split('T')[0]}
            onChange={(e) => setSearchData(prev => ({ ...prev, checkout: e.target.value }))}
            style={inputStyle}
          />

          <select
            value={searchData.guests}
            onChange={(e) => setSearchData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
            style={inputStyle}
          >
            <option value={1}>1 huésped</option>
            <option value={2}>2 huéspedes</option>
            <option value={3}>3 huéspedes</option>
            <option value={4}>4 huéspedes</option>
            <option value={5}>5+ huéspedes</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '14px',
            backgroundColor: '#1976d2',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔍 Buscar hoteles
        </button>
      </div>

      {/* Hoteles disponibles */}
      <main style={{ padding: '0 20px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>🏨 Hoteles disponibles</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Cargando hoteles...</p>
        ) : hotels.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No se encontraron hoteles.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {hotels.map(hotel => (
              <div key={hotel.id} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h3 style={{ marginBottom: '10px', color: '#1976d2' }}>{hotel.name}</h3>
                <p style={{ color: '#555' }}>📍 {hotel.city}</p>
                <p style={{ fontSize: '14px', color: '#777' }}>
                  {hotel.description?.substring(0, 100)}...
                </p>
                <button
                  onClick={() =>
                    navigate(`/details/${hotel.id}?city=${searchData.city}&checkin=${searchData.checkin}&checkout=${searchData.checkout}&guests=${searchData.guests}`)
                  }
                  style={{
                    marginTop: '15px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Ver detalles
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Estilo para inputs reutilizable
const inputStyle: React.CSSProperties = {
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
  width: '100%'
};

export default Dashboard;
