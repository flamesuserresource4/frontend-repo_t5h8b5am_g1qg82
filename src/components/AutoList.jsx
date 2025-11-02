import { useMemo } from 'react';
import { Car, Clock, Info } from 'lucide-react';

// Utility: distance in meters between two lat/lng
function haversine(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const aa = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

// Point to polyline distance (meters)
function distanceToRoute(point, route) {
  if (!route || route.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    // approximate by checking distance to segment endpoints and mid; good enough for UI filtering
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    min = Math.min(min, haversine(point, a), haversine(point, b), haversine(point, m));
  }
  return min;
}

export default function AutoList({ autos, userStart, userEnd, onBook, activeBookingId, etaMinutes = 2 }) {
  const available = useMemo(() => {
    if (!userStart || !userEnd) return [];
    const THRESH = 200; // meters from route
    return autos
      .filter((a) => a.seatsFree > 0)
      .filter((a) => distanceToRoute(userStart, a.routeCoords) < THRESH && distanceToRoute(userEnd, a.routeCoords) < THRESH)
      .map((a) => ({ ...a, distanceToStart: distanceToRoute(userStart, a.routeCoords) } ))
      .sort((x, y) => x.distanceToStart - y.distanceToStart);
  }, [autos, userStart, userEnd]);

  if (!userStart || !userEnd) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <Info size={18} />
          <span>Choose a start and destination to see available share autos.</span>
        </div>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200">
        <div className="text-gray-700">No matching autos on this route right now.</div>
        <div className="text-xs text-gray-500 mt-1">Tip: Try adjusting your start or end closer to a main road or stand.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {available.map((a) => (
        <div key={a.id} className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800 flex items-center gap-2"><Car size={18} /> Auto {a.plate}</div>
            <div className="text-sm text-gray-600">Driver: {a.driver} • Route: {a.routeName}</div>
            <div className="text-sm text-gray-600">Seats free: {a.seatsFree}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock size={14} /> Pickup wait up to {etaMinutes} min</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={activeBookingId && activeBookingId !== a.id}
              onClick={() => onBook(a)}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-md"
            >
              {activeBookingId === a.id ? 'Booked' : 'Book seat'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
