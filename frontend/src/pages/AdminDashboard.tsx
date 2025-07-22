// AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelAPI } from '../services/api';
import { Hotel } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [uploading, setUploading] = useState(false);

  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    amenities: ['WiFi', 'Desayuno'],
    rating: 4.0,
    price_range: {
      min_price: 10000,
      max_price: 25000,
      currency: 'ARS'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    thumbnail: '',
    images: [] as string[]
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'admin') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      navigate('/dashboard');
      return;
    }

    const name = localStorage.getItem('userName') || 'Admin';
    setUserName(name);
    loadHotels();
  }, [navigate]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getAllHotels();
      setHotels(response.data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
      alert('Error cargando hoteles');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB permitido');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:8001/api/v1/hotels/upload-single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error subiendo imagen');

      const result = await response.json();
      setHotelForm(prev => ({ ...prev, thumbnail: result.url }));
      alert('Imagen principal subida exitosamente');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Error subiendo imagen principal');
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es un archivo de imagen válido`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande. Máximo 5MB por archivo`);
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:8001/api/v1/hotels/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error subiendo imágenes');

      const result = await response.json();
      const newImageUrls = result.files.map((file: any) => file.url);

      setHotelForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }));

      alert(`${files.length} imágenes subidas exitosamente`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error subiendo imágenes');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setHotelForm(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleCreateHotel = async () => {
    if (!hotelForm.name || !hotelForm.city || !hotelForm.address || !hotelForm.contact.email) {
      alert('Por favor completa todos los campos obligatorios: Nombre, Ciudad, Dirección y Email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hotelForm.contact.email)) {
      alert('Por favor ingresa un email válido');
      return;
    }

    try {
      await hotelAPI.createHotel(hotelForm);
      alert('Hotel creado exitosamente');
      setShowCreateForm(false);
      resetForm();
      loadHotels();
    } catch (error) {
      console.error('Error creating hotel:', error);
      alert('Error creando hotel. Revisa que todos los campos estén completos.');
    }
  };

  const handleUpdateHotel = async () => {
    if (!editingHotel) return;

    if (!hotelForm.name || !hotelForm.city || !hotelForm.address || !hotelForm.contact.email) {
      alert('Por favor completa todos los campos obligatorios: Nombre, Ciudad, Dirección y Email');
      return;
    }

    try {
      await hotelAPI.updateHotel(editingHotel.id, hotelForm);
      alert('Hotel actualizado exitosamente');
      setEditingHotel(null);
      resetForm();
      loadHotels();
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert('Error actualizando hotel');
    }
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este hotel?')) return;

    try {
      await hotelAPI.deleteHotel(hotelId);
      alert('Hotel eliminado exitosamente');
      loadHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert('Error eliminando hotel');
    }
  };

  const resetForm = () => {
    setHotelForm({
      name: '',
      description: '',
      city: '',
      address: '',
      amenities: ['WiFi', 'Desayuno'],
      rating: 4.0,
      price_range: {
        min_price: 10000,
        max_price: 25000,
        currency: 'ARS'
      },
      contact: {
        phone: '',
        email: '',
        website: ''
      },
      thumbnail: '',
      images: []
    });
  };

  const startEditing = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      city: hotel.city,
      address: hotel.address,
      amenities: hotel.amenities || ['WiFi', 'Desayuno'],
      rating: hotel.rating,
      price_range: hotel.price_range || { min_price: 10000, max_price: 25000, currency: 'ARS' },
      contact: hotel.contact || { phone: '', email: '', website: '' },
      thumbnail: hotel.thumbnail || '',
      images: hotel.photos || []
    });
    setShowCreateForm(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

return (
  <div style={{ fontFamily: 'Segoe UI', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
    <header style={headerStyle}>
      <h1 style={{ margin: 0 }}>🛠 Panel de Administración</h1>
      <div style={headerRightStyle}>
        <span>👋 {userName}</span>
        <button onClick={handleGoToDashboard} style={buttonStyle('gray')}>🏠 Ir al Dashboard</button>
        <button onClick={handleLogout} style={buttonStyle('red')}>🚪 Cerrar sesión</button>
      </div>
    </header>

    <main style={{ padding: '30px 20px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🏨 Hoteles registrados</h2>
        <button onClick={() => { resetForm(); setShowCreateForm(true); setEditingHotel(null); }} style={buttonStyle('blue')}>
          ➕ Crear nuevo hotel
        </button>
      </div>

      {showCreateForm && (
        <div style={formCardStyle}>
          <h3 style={{ marginBottom: '15px' }}>
            {editingHotel ? '✏️ Editar Hotel' : '🆕 Crear Hotel'}
          </h3>
          <form
  onSubmit={(e) => {
    e.preventDefault();
    editingHotel ? handleUpdateHotel() : handleCreateHotel();
  }}
  style={{ display: 'grid', gap: '15px' }}
>
  <input
    type="text"
    placeholder="Nombre del hotel"
    value={hotelForm.name}
    onChange={(e) => setHotelForm(prev => ({ ...prev, name: e.target.value }))}
    required
    style={inputStyle}
  />

  <textarea
    placeholder="Descripción"
    value={hotelForm.description}
    onChange={(e) => setHotelForm(prev => ({ ...prev, description: e.target.value }))}
    style={{ ...inputStyle, minHeight: '80px' }}
  />

  <input
    type="text"
    placeholder="Ciudad"
    value={hotelForm.city}
    onChange={(e) => setHotelForm(prev => ({ ...prev, city: e.target.value }))}
    required
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Dirección"
    value={hotelForm.address}
    onChange={(e) => setHotelForm(prev => ({ ...prev, address: e.target.value }))}
    required
    style={inputStyle}
  />

  <input
    type="email"
    placeholder="Email de contacto"
    value={hotelForm.contact.email}
    onChange={(e) => setHotelForm(prev => ({
      ...prev,
      contact: { ...prev.contact, email: e.target.value }
    }))}
    required
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Teléfono"
    value={hotelForm.contact.phone}
    onChange={(e) => setHotelForm(prev => ({
      ...prev,
      contact: { ...prev.contact, phone: e.target.value }
    }))}
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Sitio web"
    value={hotelForm.contact.website}
    onChange={(e) => setHotelForm(prev => ({
      ...prev,
      contact: { ...prev.contact, website: e.target.value }
    }))}
    style={inputStyle}
  />

  <div style={{ display: 'flex', gap: '15px' }}>
    <input
      type="number"
      placeholder="Precio mínimo"
      value={hotelForm.price_range.min_price}
      onChange={(e) => setHotelForm(prev => ({
        ...prev,
        price_range: { ...prev.price_range, min_price: parseInt(e.target.value) }
      }))}
      style={inputStyle}
    />
    <input
      type="number"
      placeholder="Precio máximo"
      value={hotelForm.price_range.max_price}
      onChange={(e) => setHotelForm(prev => ({
        ...prev,
        price_range: { ...prev.price_range, max_price: parseInt(e.target.value) }
      }))}
      style={inputStyle}
    />
  </div>

  <div>
    <label>Imagen principal (thumbnail):</label><br />
    <input type="file" accept="image/*" onChange={handleThumbnailUpload} />
    {hotelForm.thumbnail && (
      <img src={hotelForm.thumbnail} alt="thumb" style={{ width: '120px', marginTop: '10px' }} />
    )}
  </div>

  <div>
    <label>Imágenes adicionales:</label><br />
    <input type="file" multiple accept="image/*" onChange={handleMultipleImagesUpload} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
      {hotelForm.images.map((url, index) => (
        <div key={index} style={{ position: 'relative' }}>
          <img src={url} alt="extra" style={{ width: '100px' }} />
          <button
            type="button"
            onClick={() => removeImage(index)}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          >×</button>
        </div>
      ))}
    </div>
  </div>

  <div style={{ display: 'flex', gap: '10px' }}>
    <button type="submit" style={buttonStyle('green')}>
      {editingHotel ? '💾 Guardar Cambios' : '🆕 Crear Hotel'}
    </button>
    <button type="button" onClick={() => { resetForm(); setShowCreateForm(false); }} style={buttonStyle('gray')}>
      Cancelar
    </button>
  </div>
</form>

        
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>⏳ Cargando hoteles...</p>
      ) : hotels.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999' }}>⚠️ No hay hoteles disponibles.</p>
      ) : (
        <div style={gridStyle}>
          {hotels.map(hotel => (
            <div key={hotel.id} style={hotelCardStyle}>
              <img
                src={hotel.thumbnail}
                alt={hotel.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <h3 style={{ marginTop: '10px', color: '#1976d2' }}>{hotel.name}</h3>
              <p style={{ fontSize: '14px', color: '#555' }}>📍 {hotel.city} - {hotel.address}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => startEditing(hotel)} style={buttonStyle('green')}>✏️ Editar</button>
                <button onClick={() => handleDeleteHotel(hotel.id)} style={buttonStyle('red')}>🗑 Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>
);

};

export default AdminDashboard;

// 🎨 Estilos Inline
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '20px',
  marginTop: '30px'
};

const hotelCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '15px',
  borderRadius: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '30px'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '100%'
};

