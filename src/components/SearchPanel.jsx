import { useEffect, useState } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function SearchPanel({ onSearch, onSetStart, onSetEnd, userStart, userEnd, searching }) {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ start: [], end: [] });

  useEffect(() => {
    const controller = new AbortController();
    const fetchSuggestions = async (q, key) => {
      if (!q || q.length < 3) {
        setSuggestions((s) => ({ ...s, [key]: [] }));
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' }, signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions((s) => ({ ...s, [key]: data.slice(0, 5) }));
      } catch (e) {
        // ignore
      }
    };
    const id = setTimeout(() => {
      fetchSuggestions(startQuery, 'start');
      fetchSuggestions(endQuery, 'end');
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [startQuery, endQuery]);

  const pickSuggestion = (item, key) => {
    const coords = [parseFloat(item.lat), parseFloat(item.lon)];
    if (key === 'start') {
      onSetStart(coords);
      setStartQuery(item.display_name);
    } else {
      onSetEnd(coords);
      setEndQuery(item.display_name);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (userStart && userEnd) onSearch(userStart, userEnd);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur rounded-xl p-4 shadow border border-gray-200">
      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Start</label>
          <div className="relative mt-1">
            <div className="absolute left-2 top-2.5 text-gray-400"><MapPin size={18} /></div>
            <input
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              placeholder="Enter start location or click map"
              className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {suggestions.start.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
                {suggestions.start.map((s) => (
                  <button
                    type="button"
                    key={`${s.place_id}`}
                    onClick={() => pickSuggestion(s, 'start')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Destination</label>
          <div className="relative mt-1">
            <div className="absolute left-2 top-2.5 text-gray-400"><Search size={18} /></div>
            <input
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              placeholder="Enter destination or click map"
              className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {suggestions.end.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
                {suggestions.end.map((s) => (
                  <button
                    type="button"
                    key={`${s.place_id}`}
                    onClick={() => pickSuggestion(s, 'end')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!userStart || !userEnd || searching}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded-md"
        >
          {searching ? 'Finding route…' : 'Find Best Route'}
        </button>
        <p className="text-xs text-gray-500">Tip: You can also click on the map to set start/end (first click sets start, second sets destination).</p>
      </form>
    </div>
  );
}
