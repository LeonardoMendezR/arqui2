import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '1990-01-01'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.login(loginData);
      const { token, user } = response;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', `${user.first_name} ${user.last_name}`);
      localStorage.setItem('userEmail', user.email);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      alert('Error en login. Verifica tus credenciales.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.first_name || !registerData.last_name) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...registerData,
        date_of_birth: registerData.date_of_birth + 'T00:00:00Z'
      };
      await bookingAPI.register(payload);
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setIsLoginMode(true);
      setRegisterData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '1990-01-01'
      });
    } catch (err) {
      alert('Error en registro. El email puede ya estar registrado.');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-branding">
          <div className="brand-icon">🏨</div>
          <h1 className="brand-title">Hotel Manager</h1>
          <p className="brand-subtitle">
            Sistema completo de reservas de hoteles con microservicios
          </p>
          <div className="test-accounts">
            <div>🔐 Cuentas de prueba:</div>
            <div><strong>Admin:</strong> admin@hotelmanager.com / password</div>
            <div><strong>Usuario:</strong> testfinal@ucc.edu.ar / password</div>
          </div>
        </div>

        <div className="auth-form">
          <div className="auth-toggle">
            <button
              className={`toggle-button ${isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(true)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`toggle-button ${!isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(false)}
            >
              Registrarse
            </button>
          </div>

          {isLoginMode ? (
            <>
              <h2 className="form-title">¡Bienvenido de vuelta! 👋</h2>
              <input
                type="email"
                placeholder="📧 Email"
                value={loginData.email}
                onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                className="input"
              />
              <input
                type="password"
                placeholder="🔒 Contraseña"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                className="input"
              />
              <button
                className="primary-button"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
              </button>
            </>
          ) : (
            <>
              <h2 className="form-title">¡Únete a nosotros! ✨</h2>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="👤 Nombre"
                  value={registerData.first_name}
                  onChange={e => setRegisterData({ ...registerData, first_name: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="👤 Apellido"
                  value={registerData.last_name}
                  onChange={e => setRegisterData({ ...registerData, last_name: e.target.value })}
                  className="input"
                />
              </div>
              <input
                type="email"
                placeholder="📧 Email"
                value={registerData.email}
                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                className="input"
              />
              <input
                type="password"
                placeholder="🔒 Contraseña"
                value={registerData.password}
                onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                className="input"
              />
              <input
                type="tel"
                placeholder="📱 Teléfono (opcional)"
                value={registerData.phone}
                onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                className="input"
              />
              <button
                className="primary-button"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? '⏳ Creando cuenta...' : '✅ Crear Cuenta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
