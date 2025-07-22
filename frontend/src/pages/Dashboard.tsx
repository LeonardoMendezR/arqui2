import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelAPI } from '../services/api';
import { Hotel } from '../types';

interface Booking {
  id: number;
  internal_hotel_id: string;
  hotel_name?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  room_type: string;
  total_price: number;
  currency: string;
  status: string;
  booking_reference: string;
  special_requests?: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    city: '',
    checkin: '',
    checkout: '',
    guests: 2
  });

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBookings, setShowBookings] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Usuario';
    const role = localStorage.getItem('userRole') || '';
    setUserName(name);
    setUserRole(role);
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

    const filtered = hotels.filter(hotel =>
      hotel.city.toLowerCase().includes(searchData.city.toLowerCase())
    );
    setHotels(filtered);
  };

  const handleShowBookings = () => {
    setShowBookings(true);
    loadUserBookings();
  };

  const loadUserBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await fetch('http://localhost:8003/api/bookings/my-bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      } else {
        console.error('Error al obtener reservas:', response.status);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#2e7d32';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#d32f2f';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '✅ Confirmada';
      case 'pending':
        return '⏳ Pendiente';
      case 'cancelled':
        return '❌ Cancelada';
      default:
        return status;
    }
  };

  if (showBookings) {
    return (
      <div style={{ fontFamily: 'Segoe UI', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0 }}>📋 Mis Reservas</h1>
          <div style={headerRightStyle}>
            <span>👋 {userName}</span>
            <button onClick={() => setShowBookings(false)} style={buttonStyle('gray')}>
              🏠 Volver al Dashboard
            </button>
            <button onClick={handleLogout} style={buttonStyle('red')}>
              📕 Cerrar sesión
            </button>
          </div>
        </header>

        <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
          {loadingBookings ? (
            <p style={{ textAlign: 'center' }}>⏳ Cargando reservas...</p>
          ) : bookings.length === 0 ? (
            <p>⚠️ No se encontraron reservas.</p>
          ) : (
            bookings.map(b => (
              <div key={b.id} style={bookingCardStyle}>
                <h3>🏨 {b.hotel_name || `Hotel ID: ${b.internal_hotel_id}`}</h3>
                <p>📅 {new Date(b.check_in_date).toLocaleDateString()} - {new Date(b.check_out_date).toLocaleDateString()}</p>
                <p>👥 {b.guests} huésped(es) • 🛏️ {b.room_type}</p>
                <p>💵 {b.total_price} {b.currency}</p>
                <p>🎫 Ref: {b.booking_reference}</p>
                <span style={{
                  backgroundColor: getStatusColor(b.status),
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  {getStatusText(b.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Segoe UI', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={headerStyle}>
  <h1 style={{ margin: 0 }}>🏨 Hotel Booking</h1>
  <div style={headerRightStyle}>
    <button onClick={handleShowBookings} style={buttonStyle('green')}>
      📋 Mis Reservas
    </button>

  {userRole === 'admin' && (
    <button onClick={() => navigate('/admin')} style={buttonStyle('blue')}>
      ⚙️ Ir al Admin
    </button>
)}

    <span>👋 {userName}</span>
    <button onClick={handleLogout} style={buttonStyle('red')}>
      🚪 Cerrar sesión
    </button>
  </div>
</header>

      <div style={searchBoxStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🔎 Encuentra tu hotel ideal</h2>
        <div style={searchGridStyle}>
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
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} huésped{n > 1 && 'es'}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} style={searchButtonStyle}>
          🔍 Buscar hoteles
        </button>
      </div>

      <main style={{ padding: '0 20px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px' }}>🏨 Hoteles disponibles</h2>
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
              <div key={hotel.id} style={hotelCardStyle}>
                <h3 style={{ color: '#1976d2' }}>{hotel.name}</h3>
                <p>📍 {hotel.city}</p>
                <p>{hotel.description?.substring(0, 100)}...</p>
                <button
                  onClick={() =>
                    navigate(`/hotel/${hotel.id}?city=${searchData.city}&checkin=${searchData.checkin}&checkout=${searchData.checkout}&guests=${searchData.guests}`)
                  }
                  style={buttonStyle('blue')}
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

// 🎨 Estilos

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  alignItems: 'center'
};

const inputStyle: React.CSSProperties = {
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '14px',
  width: '100%'
};

const buttonStyle = (color: 'blue' | 'green' | 'red' | 'gray'): React.CSSProperties => {
  const colors = {
    blue: '#1976d2',
    green: '#2e7d32',
    red: '#f44336',
    gray: '#888'
  };
  return {
    padding: '8px 16px',
    backgroundColor: colors[color],
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  };
};

const searchButtonStyle: React.CSSProperties = {
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
};

const searchBoxStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '40px 20px',
  maxWidth: '1000px',
  margin: '30px auto',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
};

const searchGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  gap: '15px'
};

const hotelCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
};

const bookingCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  marginBottom: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
};

export default Dashboard;
