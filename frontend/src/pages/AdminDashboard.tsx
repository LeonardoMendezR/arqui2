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
  <div className="admin-container">
    <header className="admin-header">
      <h1 className="admin-title">Panel de Administración</h1>
      <div className="admin-user-info">
        <span>👤 {userName}</span>
        <button className="accent" onClick={handleGoToDashboard}>Ir al Dashboard</button>
        <button className="danger" onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </header>

    <main className="admin-content">
      <div className="card">
        <h2 className="section-title">Hoteles Registrados</h2>
        <button
          className="primary"
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
            setEditingHotel(null);
          }}
        >
          ➕ Crear nuevo hotel
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h3 className="section-title">
            {editingHotel ? '✏️ Editar Hotel' : '🏨 Crear Hotel'}
          </h3>
          {/* Aquí iría el formulario visual que podemos trabajar en la próxima respuesta */}
        </div>
      )}

      <div className="grid-4" style={{ marginTop: '40px' }}>
        {hotels.map(hotel => (
          <div key={hotel.id} className="card hotel-card">
            <img src={hotel.thumbnail} alt={hotel.name} className="hotel-thumbnail" />
            <h3 style={{ marginTop: '10px' }}>{hotel.name}</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>{hotel.city} · {hotel.address}</p>
            <div className="admin-card-actions">
              <button className="accent" onClick={() => startEditing(hotel)}>Editar</button>
              <button className="danger" onClick={() => handleDeleteHotel(hotel.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

};

export default AdminDashboard;
