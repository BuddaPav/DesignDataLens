// Map Panel - World map and travel

import { Lock } from 'lucide-react';
import type { Location } from '@/types/game';

interface MapPanelProps {
  locations: Location[];
  discoveredLocations: string[];
  currentLocation: Location;
  onTravel: (locationId: string) => void;
}

export function MapPanel({ locations, discoveredLocations, currentLocation, onTravel }: MapPanelProps) {
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏘️';
      case 'forest': return '🌲';
      case 'dungeon': return '🏰';
      case 'mountain': return '⛰️';
      case 'coast': return '🌊';
      case 'ruins': return '🗿';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        Discovered {discoveredLocations.length} of {locations.length} locations
      </div>

      <div className="space-y-2">
        {locations.map((location) => {
          const isDiscovered = discoveredLocations.includes(location.id);
          const isCurrent = location.id === currentLocation.id;
          const isConnected = currentLocation.connectedLocations.includes(location.id);

          return (
            <div
              key={location.id}
              onClick={() => isDiscovered && isConnected && onTravel(location.id)}
              className={`
                p-3 rounded-lg border transition-all
                ${isCurrent 
                  ? 'bg-violet-500/20 border-violet-500' 
                  : isDiscovered && isConnected
                    ? 'bg-slate-900/50 border-slate-700 hover:border-violet-500/50 cursor-pointer'
                    : 'bg-slate-900/30 border-slate-800 opacity-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getLocationIcon(location.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${isCurrent ? 'text-violet-300' : ''}`}>
                      {isDiscovered ? location.name : '???'}
                    </p>
                    {isCurrent && (
                      <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
                        Here
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {isDiscovered ? location.description : 'Undiscovered location'}
                  </p>
                </div>
                {!isDiscovered && <Lock className="w-4 h-4 text-slate-600" />}
                {isDiscovered && !isConnected && !isCurrent && (
                  <span className="text-xs text-slate-600">Too far</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="mb-2">You can travel to connected locations.</p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-violet-500 rounded-full" />
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-600 rounded-full" />
            Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-800 rounded-full" />
            Unknown
          </span>
        </div>
      </div>
    </div>
  );
}
