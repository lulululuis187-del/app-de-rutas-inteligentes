import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CENTER = [6.25184, -75.56359];

function pinIcon(color, label) {
  return L.divIcon({
    className: '',
    iconSize: [160, 28],
    iconAnchor: [14, 14],
    html: `<div style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:2px solid ${color};border-radius:999px;padding:4px 8px;font:700 11px 'DM Sans',sans-serif;color:#0f172a;white-space:nowrap;box-shadow:0 4px 6px rgba(15,23,42,.08)"><span style="width:8px;height:8px;border-radius:99px;background:${color};display:inline-block"></span>${label}</div>`,
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, points]);
  return null;
}

export default function MapView({ paradas = [], className = '' }) {
  const visibles = [];
  const vistos = new Set();
  paradas.forEach((parada) => {
    if (parada.latitud == null || parada.longitud == null) return;
    const clave = `${Number(parada.latitud).toFixed(4)}|${Number(parada.longitud).toFixed(4)}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    visibles.push(parada);
  });
  const points = visibles.map((parada) => [Number(parada.latitud), Number(parada.longitud)]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#e2e8f0] ${className}`}>
      <MapContainer center={points[0] || CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.length > 1 && (
          <Polyline positions={points} pathOptions={{ color: '#0252ff', weight: 5, opacity: 0.9 }} />
        )}
        {visibles.map((parada, index) => {
          const color = index === 0 ? '#0252ff' : index === visibles.length - 1 ? '#10b981' : '#f59e0b';
          const label = parada.nombre;
          return (
            <Marker
              key={`${parada.id_parada || parada.nombre}-${index}`}
              position={[Number(parada.latitud), Number(parada.longitud)]}
              icon={pinIcon(color, label)}
            >
              <Popup>
                <strong>{parada.nombre}</strong>
                {parada.ruta_nombre ? <div>{parada.ruta_nombre}</div> : null}
                {parada.distancia_metros != null ? <div>{parada.distancia_metros} m</div> : null}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
