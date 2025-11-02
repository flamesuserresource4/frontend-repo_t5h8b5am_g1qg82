import { useCallback, useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import MapView from './components/MapView.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import AutoList from './components/AutoList.jsx';
import BookingPanel from './components/BookingPanel.jsx';
import { Map, Route, User } from 'lucide-react';

// Sample fixed routes (polyline coords) for demo autos
const ROUTE_A = [
  [28.6448, 77.216721], // Connaught Place
  [28.626, 77.218],
  [28.6129, 77.2295],
  [28.5933, 77.2273], // India Gate area
  [28.5733, 77.2090],
];
const ROUTE_B = [
  [28.6347, 77.2200],
  [28.6400, 77.2000],
  [28.6500, 77.1800],
  [28.6600, 77.1600],
];

const STANDS = [
  { name: 'Rajiv Chowk Stand', position: [28.6328, 77.2197] },
  { name: 'India Gate Stand', position: [28.6129, 77.2295] },
  { name: 'Khan Market Stand', position: [28.6004, 77.2276] },
];

const DEMO_AUTOS = [
  {
    id: 'A1', plate: 'DL 1R 4321', driver: 'Amit', seatsFree: 1, routeName: 'Route A',
    routeCoords: ROUTE_A, currentLocation: ROUTE_A[2],
  },
  {
    id: 'A2', plate: 'DL 2S 9876', driver: 'Bhavna', seatsFree: 0, routeName: 'Route A',
    routeCoords: ROUTE_A, currentLocation: ROUTE_A[1],
  },
  {
    id: 'B1', plate: 'DL 3T 5555', driver: 'Chandan', seatsFree: 1, routeName: 'Route B',
    routeCoords: ROUTE_B, currentLocation: ROUTE_B[1],
  },
];

function decodeOSRMPolyline(geometry) {
  // geometry.coordinates already provided when using overview=full&geometries=geojson
  return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

export default function App() {
  const [userStart, setUserStart] = useState(null);
  const [userEnd, setUserEnd] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [searching, setSearching] = useState(false);
  const [autos, setAutos] = useState(DEMO_AUTOS);
  const [booking, setBooking] = useState(null);

  // Map click: first sets start, second sets end, then toggles
  const handleMapClick = useCallback((coords) => {
    if (!userStart) setUserStart(coords);
    else if (!userEnd) setUserEnd(coords);
    else {
      setUserStart(coords);
      setUserEnd(null);
      setRouteCoords([]);
    }
  }, [userStart, userEnd]);

  const findRoute = useCallback(async (start, end) => {
    // Use OSRM demo server (free) for routing
    try {
      setSearching(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = decodeOSRMPolyline(data.routes[0].geometry);
        setRouteCoords(coords);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }, []);

  const onBook = useCallback((auto) => {
    if (auto.seatsFree <= 0) return;
    // booking allowed only if pickup is near the auto route and on current routeCoords (enforced by filter in list)
    // reduce seat and start 2-minute timer
    setAutos((prev) => prev.map((a) => a.id === auto.id ? { ...a, seatsFree: a.seatsFree - 1 } : a));
    setBooking({ auto, createdAt: Date.now(), expiresAt: Date.now() + 2 * 60 * 1000 });
  }, []);

  const cancelBooking = useCallback((reason) => {
    if (!booking) return;
    // free the seat back if timeout or user canceled
    setAutos((prev) => prev.map((a) => a.id === booking.auto.id ? { ...a, seatsFree: a.seatsFree + 1 } : a));
    setBooking(null);
  }, [booking]);

  const activeBookingId = booking?.auto?.id || null;

  const center = useMemo(() => userStart || [28.6139, 77.209], [userStart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-indigo-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 font-semibold"><Map size={20} /> Share Auto Pooling</div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="hidden md:flex items-center gap-1"><Route size={18} /> Shortest route</div>
            <div className="flex items-center gap-1"><User size={18} /> 100% free stack</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[70vh]">
          <MapView
            center={center}
            stands={STANDS}
            autos={autos}
            userStart={userStart}
            userEnd={userEnd}
            routeCoords={routeCoords}
            onMapClick={handleMapClick}
          />
        </div>
        <div className="space-y-4">
          <SearchPanel
            onSearch={findRoute}
            onSetStart={setUserStart}
            onSetEnd={setUserEnd}
            userStart={userStart}
            userEnd={userEnd}
            searching={searching}
          />

          <AutoList
            autos={autos}
            userStart={userStart}
            userEnd={userEnd}
            onBook={onBook}
            activeBookingId={activeBookingId}
          />

          <BookingPanel
            booking={booking}
            userStart={userStart}
            userEnd={userEnd}
            onCancel={cancelBooking}
          />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-6 text-xs text-gray-500">
        Map data © OpenStreetMap contributors • Routing by OSRM • Auth/Realtime DB/Deployment planned: Firebase + GitHub Pages/Render
      </footer>
    </div>
  );
}
