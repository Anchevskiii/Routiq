import React, { useMemo, useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Activity } from '@/types/itinerary.types';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

interface ItineraryMapProps {
  activities: Activity[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ activities }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const validActivities = useMemo(() => {
    return activities.filter(a => a.latitude != null && a.longitude != null);
  }, [activities]);

  React.useEffect(() => {
    if (map && validActivities.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validActivities.forEach(a => {
        bounds.extend({ lat: a.latitude!, lng: a.longitude! });
      });
      map.fitBounds(bounds);
      
      // If only one marker, avoid zooming in too far
      if (validActivities.length === 1) {
        const listener = window.google.maps.event.addListener(map, 'idle', function() {
          if (map.getZoom()! > 15) {
            map.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, validActivities]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-red-50 rounded-[2rem] flex flex-col items-center justify-center border border-red-100 p-6 text-center">
        <span className="text-red-500 font-bold mb-2">Map Load Error</span>
        <span className="text-sm text-red-400">Please check your Google Maps API key configuration.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-[2rem] flex items-center justify-center border border-gray-200 animate-pulse">
        <span className="text-gray-400 font-medium">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 0, lng: 0 }}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {validActivities.map((activity) => (
          <Marker
            key={activity.id}
            position={{ lat: activity.latitude!, lng: activity.longitude! }}
            onClick={() => setSelectedActivity(activity)}
            label={{
              text: (activity.sortOrder + 1).toString(),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              labelOrigin: new window.google.maps.Point(16, 10),
            }}
          />
        ))}

        {selectedActivity && selectedActivity.latitude && selectedActivity.longitude && (
          <InfoWindow
            position={{ lat: selectedActivity.latitude, lng: selectedActivity.longitude }}
            onCloseClick={() => setSelectedActivity(null)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{selectedActivity.title}</h3>
              {selectedActivity.address && (
                <p className="text-xs text-gray-500">{selectedActivity.address}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};
