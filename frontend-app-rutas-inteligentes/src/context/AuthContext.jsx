import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

function persist(token, usuario) {
  if (token) localStorage.setItem('rf-token', token);
  else localStorage.removeItem('rf-token');
  if (usuario) localStorage.setItem('rf-user', JSON.stringify(usuario));
  else localStorage.removeItem('rf-user');
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rf-user') || 'null');
    } catch {
      return null;
    }
  });
  const [listo, setListo] = useState(!localStorage.getItem('rf-token'));

  useEffect(() => {
    const token = localStorage.getItem('rf-token');
    if (!token) return undefined;
    let activo = true;
    api.get('/api/auth/me')
      .then((data) => {
        if (!activo) return;
        setUsuario(data.usuario);
        persist(token, data.usuario);
      })
      .catch(() => {
        if (!activo) return;
        setUsuario(null);
        persist(null, null);
      })
      .finally(() => {
        if (activo) setListo(true);
      });
    return () => {
      activo = false;
    };
  }, []);

  const value = useMemo(() => ({
    usuario,
    listo,
    async ingresar(correo, password) {
      const data = await api.post('/api/auth/login', { correo, password });
      persist(data.token, data.usuario);
      setUsuario(data.usuario);
      return data.usuario;
    },
    async registrar(payload) {
      const data = await api.post('/api/auth/registro', payload);
      persist(data.token, data.usuario);
      setUsuario(data.usuario);
      return data.usuario;
    },
    salir() {
      setUsuario(null);
      persist(null, null);
    },
  }), [usuario, listo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// El hook vive junto al provider para que el contexto no se recree en cada import.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
