import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

// Default icon fix for Leaflet in bundlers
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapView({
  center = [28.6139, 77.209],
  zoom = 13,
  stands = [],
  autos = [],
  userStart,
  userEnd,
  routeCoords = [],
  onMapClick,
}) {
  const mapRef = useRef(null);

  const bounds = useMemo(() => {
    const points = [];
    if (routeCoords && routeCoords.length) points.push(...routeCoords);
    if (userStart) points.push(userStart);
    if (userEnd) points.push(userEnd);
    if (!points.length) return null;
    return L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
  }, [routeCoords, userStart, userEnd]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.flyTo && bounds) {
      const leaflet = map;
      leaflet.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* User markers */}
        {userStart && (
          <Marker position={userStart} icon={defaultIcon}>
            <Popup>Start Point</Popup>
          </Marker>
        )}
        {userEnd && (
          <Marker position={userEnd} icon={defaultIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoords && routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 5 }} />
        )}

        {/* Stands */}
        {stands.map((s, idx) => (
          <CircleMarker key={`stand-${idx}`} center={s.position} radius={6} pathOptions={{ color: '#16a34a', fillColor: '#16a34a' }}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{s.name}</div>
                <div className="text-gray-600">Stand</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Autos */}
        {autos.map((a) => (
          <Marker key={a.id} position={a.currentLocation} icon={defaultIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Auto {a.plate}</div>
                <div>Driver: {a.driver}</div>
                <div>Seats: {a.seatsFree} free</div>
                <div className="text-gray-600">Route: {a.routeName}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <ClickHandler onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
