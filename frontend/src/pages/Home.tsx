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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-800">🏨 Hotel Booking</h1>
        <p className="text-lg text-gray-600 mt-2">Encuentra el hotel perfecto para tu próximo viaje</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">✈️ Buscar Hoteles</h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏙️ Ciudad de destino</label>
            <input
              type="text"
              value={searchParams.city}
              onChange={handleInputChange('city')}
              placeholder="Ej: Córdoba, Mendoza..."
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👥 Número de huéspedes</label>
            <input
              type="number"
              value={searchParams.guests}
              onChange={handleInputChange('guests')}
              min="1"
              max="10"
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Check-in</label>
            <input
              type="date"
              value={searchParams.checkin}
              onChange={handleInputChange('checkin')}
              min={today}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Check-out</label>
            <input
              type="date"
              value={searchParams.checkout}
              onChange={handleInputChange('checkout')}
              min={searchParams.checkin || today}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg transition"
          >
            🔍 Buscar Hoteles
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
