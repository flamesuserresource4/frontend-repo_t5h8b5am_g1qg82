import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';

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

export default function BookingPanel({ booking, userStart, userEnd, onCancel }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!booking) return;
    const expiresAt = booking.expiresAt;
    const tick = () => {
      const s = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) onCancel('timeout');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking, onCancel]);

  const distanceKm = useMemo(() => {
    if (!userStart || !userEnd) return 0;
    return (haversine(userStart, userEnd) / 1000).toFixed(2);
  }, [userStart, userEnd]);

  const fare = useMemo(() => {
    const base = 10; // base fare
    const perKm = 8; // per km fare
    const total = base + perKm * parseFloat(distanceKm || '0');
    return Math.max(15, Math.round(total));
  }, [distanceKm]);

  if (!booking) return null;

  const mailtoLink = `mailto:emergency@example.com?subject=SOS%20from%20Share%20Auto%20App&body=I%20need%20help.%20My%20auto:%20${encodeURIComponent(booking.auto.plate)}%20Driver:%20${encodeURIComponent(booking.auto.driver)}%20Pickup:${encodeURIComponent(userStart)}%20Destination:${encodeURIComponent(userEnd)}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-800">Your Booking</div>
        <button onClick={() => onCancel('user')} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="text-sm text-gray-700">Auto {booking.auto.plate} • Driver {booking.auto.driver}</div>
      <div className="text-sm text-gray-700">Seats reserved: 1 • Fare estimate: ₹{fare}</div>
      <div className="text-sm text-gray-700">Reach pickup within: <span className="font-semibold">{secondsLeft}s</span></div>
      <div className="flex items-center gap-2 mt-3">
        <a href={mailtoLink} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm">
          <AlertTriangle size={16} /> SOS Email
        </a>
        <a href="https://t.me/share_autopool_bot" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm">
          <Phone size={16} /> Telegram Bot
        </a>
      </div>
      <p className="text-xs text-gray-500 mt-2">The driver waits up to 2 minutes at the pickup stop before leaving automatically.</p>
    </div>
  );
}
