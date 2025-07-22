import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchParams } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: '',
    checkin: '',
    checkout: '',
    guests: 2
  });
  const [error, setError] = useState<string>('');

  const handleSearch = () => {
    if (!searchParams.city.trim()) {
      setError('La ciudad es obligatoria');
      return;
    }

    if (!searchParams.checkin || !searchParams.checkout) {
      setError('Las fechas son obligatorias');
      return;
    }

    if (new Date(searchParams.checkout) <= new Date(searchParams.checkin)) {
      setError('La fecha de check-out debe ser posterior al check-in');
      return;
    }

    setError('');

    const queryParams = new URLSearchParams({
      city: searchParams.city,
      checkin: searchParams.checkin,
      checkout: searchParams.checkout,
      guests: searchParams.guests.toString()
    });

    navigate(`/results?${queryParams.toString()}`);
  };

  const handleInputChange = (field: keyof SearchParams) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: field === 'guests' ? parseInt(event.target.value) || 1 : event.target.value
    }));
    if (error) setError('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="home-container">
      <h1 className="section-title" style={{ textAlign: 'center' }}>🏨 Hotel Booking</h1>
      <h2 style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Encuentra el hotel perfecto para tu próximo viaje
      </h2>

      <div className="card">
        <h3 className="section-title" style={{ textAlign: 'center' }}>
          ✈️ Buscar Hoteles
        </h3>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div>
            <label className="form-label">🏙️ Ciudad de destino:</label>
            <input
              type="text"
              value={searchParams.city}
              onChange={handleInputChange('city')}
              placeholder="Ej: Córdoba, Buenos Aires, Mendoza..."
              required
            />
          </div>

          <div>
            <label className="form-label">👥 Número de huéspedes:</label>
            <input
              type="number"
              value={searchParams.guests}
              onChange={handleInputChange('guests')}
              min="1"
              max="10"
              required
            />
          </div>

          <div>
            <label className="form-label">📅 Fecha de check-in:</label>
            <input
              type="date"
              value={searchParams.checkin}
              onChange={handleInputChange('checkin')}
              min={today}
              required
            />
          </div>

          <div>
            <label className="form-label">📅 Fecha de check-out:</label>
            <input
              type="date"
              value={searchParams.checkout}
              onChange={handleInputChange('checkout')}
              min={searchParams.checkin || today}
              required
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button className="primary" onClick={handleSearch}>
            🔍 Buscar Hoteles
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: '40px' }}>
        <div className="info-card">
          <h3>🌟 Hoteles de Calidad</h3>
          <p>Trabajamos con los mejores hoteles de Argentina para garantizar tu comodidad.</p>
        </div>

        <div className="info-card">
          <h3>💰 Mejores Precios</h3>
          <p>Encuentra las mejores ofertas y precios competitivos para tu estadía.</p>
        </div>

        <div className="info-card">
          <h3>🔒 Reserva Segura</h3>
          <p>Tus datos y pagos están protegidos con la mejor tecnología de seguridad.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
