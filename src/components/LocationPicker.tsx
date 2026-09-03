import React, { useState } from 'react';
import { LocationPin } from '../types';
import { 
  MapPin, 
  Navigation, 
  X, 
  ExternalLink, 
  Loader2, 
  Compass,
  Check
} from 'lucide-react';

interface LocationPickerProps {
  location?: LocationPin;
  onChangeLocation: (loc: LocationPin | undefined) => void;
}

const PRESET_PLACES = [
  { name: 'Home Sanctuary', city: 'Home', lat: 37.7749, lng: -122.4194 },
  { name: 'Quiet Trail & Nature', city: 'Park', lat: 37.8044, lng: -122.2712 },
  { name: 'Coffee Roastery', city: 'Urban Space', lat: 37.7833, lng: -122.4167 },
  { name: 'Focus Office & Desk', city: 'Workspace', lat: 37.7891, lng: -122.4014 },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onChangeLocation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use Browser Geolocation API
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch('/api/maps/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (res.ok) {
            const data = await res.json();
            onChangeLocation({
              lat: latitude,
              lng: longitude,
              address: data.formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              placeName: data.placeName || 'Current Location',
              city: data.city || 'Nearby',
            });
            setIsOpen(false);
          } else {
            // Coordinate fallback
            onChangeLocation({
              lat: latitude,
              lng: longitude,
              address: `GPS Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              placeName: 'Current Position',
              city: 'Local Area',
            });
            setIsOpen(false);
          }
        } catch (err: any) {
          onChangeLocation({
            lat: latitude,
            lng: longitude,
            address: `GPS Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            placeName: 'Current Position',
            city: 'Local Area',
          });
          setIsOpen(false);
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMsg('Location access was denied or timed out. You can pick a preset or type a place name.');
        setIsDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: typeof PRESET_PLACES[0]) => {
    onChangeLocation({
      lat: preset.lat,
      lng: preset.lng,
      address: `${preset.name} (${preset.city})`,
      placeName: preset.name,
      city: preset.city,
    });
    setIsOpen(false);
  };

  const handleApplyCustomQuery = () => {
    if (!customQuery.trim()) return;
    // Generate pseudo-coordinates based on hash for visual map plotting
    const hash = Array.from(customQuery).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockLat = 37.7749 + (hash % 100) * 0.003 - 0.15;
    const mockLng = -122.4194 + ((hash * 7) % 100) * 0.003 - 0.15;

    onChangeLocation({
      lat: parseFloat(mockLat.toFixed(4)),
      lng: parseFloat(mockLng.toFixed(4)),
      address: customQuery.trim(),
      placeName: customQuery.trim(),
      city: 'Custom Space',
    });
    setCustomQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Attached Location Badge (When selected) */}
      {location ? (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 text-xs shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">
            {location.placeName || location.city || location.address}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-200 transition-colors"
            title="Open coordinates in Google Maps"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => onChangeLocation(undefined)}
            className="text-indigo-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded-sm hover:bg-indigo-900/50"
            title="Remove location tag"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Pin Location Trigger Button */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800/80 border border-slate-700/60 rounded-lg transition-all cursor-pointer"
          title="Pin a geographic location to this reflection"
        >
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Pin Location</span>
        </button>
      )}

      {/* Location Selector Dropdown / Modal */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-40 w-72 sm:w-80 p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Location-Aware Reflection</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-2 mb-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Quick GPS Geolocation button */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer mb-3"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Acquiring GPS Position...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Use Current GPS Coordinates</span>
              </>
            )}
          </button>

          {/* Place Search Input */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
              Or Custom Place / Setting
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomQuery()}
                placeholder="e.g. Kyoto Zen Garden, Library..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleApplyCustomQuery}
                disabled={!customQuery.trim()}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>

          {/* Preset Environments */}
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Reflection Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_PLACES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="flex items-center gap-1.5 p-1.5 text-[11px] text-left text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
