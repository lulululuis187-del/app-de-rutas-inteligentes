import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const tabs = ['Rutas', 'Paradas', 'Instrucciones', 'Transportes', 'Alertas', 'Usuarios'];
const field = 'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#0252ff]';

const emptyRuta = {
  nombre: '', tiempo_estimado: 30, costo_aproximado: 3000, transbordos: 0,
  id_transporte: '', origen: '', destino: '', distancia_caminar: 5,
  resumen: '', horario: '', estado_trafico: 'Servicio normal', etiqueta: '',
};

export default function AdminPage() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('Rutas');
  const [rutas, setRutas] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [rutaForm, setRutaForm] = useState(emptyRuta);
  const [editId, setEditId] = useState(null);
  const [parada, setParada] = useState({ id_ruta: '', nombre: '', latitud: '', longitud: '', orden: 1 });
  const [paso, setPaso] = useState({ id_ruta: '', titulo: '', detalle: '', tipo: 'bus', orden: 1 });
  const [transporte, setTransporte] = useState({ tipo: 'Bus', nombre: '', codigo: '' });
  const [alerta, setAlerta] = useState({ id_ruta: '', titulo: '', mensaje: '', severidad: 'advertencia' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargar() {
    const [rutasData, transportesData, usuariosData, alertasData] = await Promise.all([
      api.get('/api/rutas'),
      api.get('/api/transportes'),
      api.get('/api/admin/usuarios'),
      api.get('/api/alertas'),
    ]);
    setRutas(rutasData.rutas || []);
    setTransportes(transportesData.transportes || []);
    setUsuarios(usuariosData.usuarios || []);
    setAlertas(alertasData.alertas || []);
  }

  useEffect(() => {
    if (usuario?.rol !== 'administrador') return;
    cargar().catch((err) => setError(err.message));
  }, [usuario]);

  if (!usuario) return <Navigate to="/ingresar" replace />;
  if (usuario.rol !== 'administrador') return <Navigate to="/" replace />;

  async function run(action) {
    setError('');
    setMensaje('');
    try {
      await action();
      await cargar();
      setMensaje('Cambios guardados.');
    } catch (err) {
      setError(err.message);
    }
  }

  function setField(setter, key, value) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  const paradas = rutas.flatMap((ruta) => (ruta.paradas || []).map((paradaItem) => ({ ...paradaItem, ruta: ruta.nombre })));
  const pasos = rutas.flatMap((ruta) => (ruta.instrucciones || []).map((pasoItem) => ({ ...pasoItem, ruta: ruta.nombre })));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Administración</h1>
        <p className="text-sm text-[#475569]">Rutas, paradas, horarios, costos, alertas y usuarios.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-3 py-2 text-sm ${tab === item ? 'bg-[#0252ff] font-bold text-white' : 'bg-white font-medium text-[#475569]'}`}>
            {item}
          </button>
        ))}
      </div>
      {mensaje && <p className="text-sm font-semibold text-[#10b981]">{mensaje}</p>}
      {error && <p className="text-sm font-semibold text-[#ef4444]">{error}</p>}

      {tab === 'Rutas' && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form className="flex flex-col gap-2 rounded-2xl bg-white p-4" onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              if (editId) await api.put(`/api/admin/rutas/${editId}`, rutaForm);
              else await api.post('/api/admin/rutas', rutaForm);
              setRutaForm(emptyRuta);
              setEditId(null);
            });
          }}>
            <input className={field} placeholder="Nombre" value={rutaForm.nombre} onChange={(e) => setField(setRutaForm, 'nombre', e.target.value)} required />
            <input className={field} placeholder="Origen" value={rutaForm.origen} onChange={(e) => setField(setRutaForm, 'origen', e.target.value)} />
            <input className={field} placeholder="Destino" value={rutaForm.destino} onChange={(e) => setField(setRutaForm, 'destino', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className={field} type="number" placeholder="Minutos" value={rutaForm.tiempo_estimado} onChange={(e) => setField(setRutaForm, 'tiempo_estimado', e.target.value)} />
              <input className={field} type="number" placeholder="Costo" value={rutaForm.costo_aproximado} onChange={(e) => setField(setRutaForm, 'costo_aproximado', e.target.value)} />
              <input className={field} type="number" placeholder="Transbordos" value={rutaForm.transbordos} onChange={(e) => setField(setRutaForm, 'transbordos', e.target.value)} />
              <input className={field} type="number" placeholder="Min. a pie" value={rutaForm.distancia_caminar} onChange={(e) => setField(setRutaForm, 'distancia_caminar', e.target.value)} />
            </div>
            <select className={field} value={rutaForm.id_transporte} onChange={(e) => setField(setRutaForm, 'id_transporte', e.target.value)}>
              <option value="">Transporte</option>
              {transportes.map((item) => <option key={item.id_transporte} value={item.id_transporte}>{item.nombre}</option>)}
            </select>
            <input className={field} placeholder="Horario" value={rutaForm.horario} onChange={(e) => setField(setRutaForm, 'horario', e.target.value)} />
            <input className={field} placeholder="Estado del servicio" value={rutaForm.estado_trafico} onChange={(e) => setField(setRutaForm, 'estado_trafico', e.target.value)} />
            <input className={field} placeholder="Resumen del recorrido" value={rutaForm.resumen} onChange={(e) => setField(setRutaForm, 'resumen', e.target.value)} />
            <button className="rounded-xl bg-[#0252ff] py-3 font-bold text-white" type="submit">{editId ? 'Actualizar ruta' : 'Crear ruta'}</button>
          </form>
          <div className="flex flex-col gap-2">
            {rutas.map((ruta) => (
              <article key={ruta.id_ruta} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                <div>
                  <p className="font-bold">{ruta.nombre}</p>
                  <p className="text-xs text-[#475569]">{ruta.origen} → {ruta.destino} · {ruta.horario}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm font-bold text-[#0252ff]" onClick={() => { setEditId(ruta.id_ruta); setRutaForm({ ...ruta, id_transporte: ruta.transporte?.id_transporte || '' }); }}>Editar</button>
                  <button type="button" className="text-sm font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/rutas/${ruta.id_ruta}`))}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'Paradas' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <form className="flex flex-col gap-2 rounded-2xl bg-white p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/paradas', parada)); }}>
            <select className={field} value={parada.id_ruta} onChange={(e) => setField(setParada, 'id_ruta', e.target.value)} required>
              <option value="">Ruta</option>
              {rutas.map((ruta) => <option key={ruta.id_ruta} value={ruta.id_ruta}>{ruta.nombre}</option>)}
            </select>
            <input className={field} placeholder="Nombre de la parada" value={parada.nombre} onChange={(e) => setField(setParada, 'nombre', e.target.value)} required />
            <input className={field} placeholder="Latitud" value={parada.latitud} onChange={(e) => setField(setParada, 'latitud', e.target.value)} />
            <input className={field} placeholder="Longitud" value={parada.longitud} onChange={(e) => setField(setParada, 'longitud', e.target.value)} />
            <input className={field} type="number" placeholder="Orden" value={parada.orden} onChange={(e) => setField(setParada, 'orden', e.target.value)} />
            <button className="rounded-xl bg-[#0252ff] py-3 font-bold text-white" type="submit">Agregar parada</button>
          </form>
          <ul className="flex flex-col gap-2">
            {paradas.map((item) => (
              <li key={item.id_parada} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                <span><strong>{item.nombre}</strong> · {item.ruta}</span>
                <button type="button" className="font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/paradas/${item.id_parada}`))}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'Instrucciones' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <form className="flex flex-col gap-2 rounded-2xl bg-white p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/instrucciones', paso)); }}>
            <select className={field} value={paso.id_ruta} onChange={(e) => setField(setPaso, 'id_ruta', e.target.value)} required>
              <option value="">Ruta</option>
              {rutas.map((ruta) => <option key={ruta.id_ruta} value={ruta.id_ruta}>{ruta.nombre}</option>)}
            </select>
            <input className={field} placeholder="Título del paso" value={paso.titulo} onChange={(e) => setField(setPaso, 'titulo', e.target.value)} required />
            <input className={field} placeholder="Detalle" value={paso.detalle} onChange={(e) => setField(setPaso, 'detalle', e.target.value)} />
            <select className={field} value={paso.tipo} onChange={(e) => setField(setPaso, 'tipo', e.target.value)}>
              {['caminar', 'bus', 'metro', 'transbordo', 'llegada'].map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
            <button className="rounded-xl bg-[#0252ff] py-3 font-bold text-white" type="submit">Agregar paso</button>
          </form>
          <ul className="flex flex-col gap-2">
            {pasos.map((item) => (
              <li key={item.id_instruccion} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                <span><strong>{item.titulo}</strong> · {item.ruta}</span>
                <button type="button" className="font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/instrucciones/${item.id_instruccion}`))}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'Transportes' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <form className="flex flex-col gap-2 rounded-2xl bg-white p-4" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/api/admin/transportes', transporte); setTransporte({ tipo: 'Bus', nombre: '', codigo: '' }); }); }}>
            <input className={field} placeholder="Tipo (Bus, Metro, Integrado)" value={transporte.tipo} onChange={(e) => setField(setTransporte, 'tipo', e.target.value)} />
            <input className={field} placeholder="Nombre" value={transporte.nombre} onChange={(e) => setField(setTransporte, 'nombre', e.target.value)} required />
            <input className={field} placeholder="Código" value={transporte.codigo} onChange={(e) => setField(setTransporte, 'codigo', e.target.value)} />
            <button className="rounded-xl bg-[#0252ff] py-3 font-bold text-white" type="submit">Crear transporte</button>
          </form>
          <ul className="flex flex-col gap-2">
            {transportes.map((item) => (
              <li key={item.id_transporte} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                <span><strong>{item.nombre}</strong> · {item.tipo} · {item.codigo}</span>
                <button type="button" className="font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/transportes/${item.id_transporte}`))}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'Alertas' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <form className="flex flex-col gap-2 rounded-2xl bg-white p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/alertas', alerta)); }}>
            <select className={field} value={alerta.id_ruta} onChange={(e) => setField(setAlerta, 'id_ruta', e.target.value)}>
              <option value="">Todas las rutas</option>
              {rutas.map((ruta) => <option key={ruta.id_ruta} value={ruta.id_ruta}>{ruta.nombre}</option>)}
            </select>
            <input className={field} placeholder="Título" value={alerta.titulo} onChange={(e) => setField(setAlerta, 'titulo', e.target.value)} required />
            <textarea className={field} placeholder="Mensaje" value={alerta.mensaje} onChange={(e) => setField(setAlerta, 'mensaje', e.target.value)} required />
            <select className={field} value={alerta.severidad} onChange={(e) => setField(setAlerta, 'severidad', e.target.value)}>
              <option value="info">info</option>
              <option value="advertencia">advertencia</option>
              <option value="critica">critica</option>
            </select>
            <button className="rounded-xl bg-[#0252ff] py-3 font-bold text-white" type="submit">Publicar alerta</button>
          </form>
          <ul className="flex flex-col gap-2">
            {alertas.map((item) => (
              <li key={item.id_alerta} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm">
                <span><strong>{item.titulo}</strong> · {item.severidad}</span>
                <button type="button" className="font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/alertas/${item.id_alerta}`))}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'Usuarios' && (
        <ul className="flex flex-col gap-2">
          {usuarios.map((item) => (
            <li key={item.id_usuario} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <span>
                <span className="block font-bold">{item.nombre}</span>
                <span className="text-sm text-[#475569]">{item.correo}</span>
              </span>
              <span className="flex items-center gap-2">
                <select
                  className={field}
                  value={item.rol}
                  onChange={(e) => run(() => api.patch(`/api/admin/usuarios/${item.id_usuario}`, { rol: e.target.value }))}
                >
                  <option value="usuario">usuario</option>
                  <option value="administrador">administrador</option>
                </select>
                <button type="button" className="text-sm font-bold text-[#ef4444]" onClick={() => run(() => api.delete(`/api/admin/usuarios/${item.id_usuario}`))}>Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
