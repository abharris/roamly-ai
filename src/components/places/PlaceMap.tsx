import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Place } from '../../types/models';
import { Colors } from '../../theme';

interface PlaceMapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onMarkerPress: (placeId: string) => void;
}

function toNum(v: any): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}


export function PlaceMap({ places, selectedPlaceId, onMarkerPress }: PlaceMapProps) {
  const mapRef = useRef<MapView>(null);

  const geoPlaces = places
    .map(p => ({ ...p, lat: toNum(p.lat), lng: toNum(p.lng) }))
    .filter(p => p.lat != null && p.lng != null);

  useEffect(() => {
    if (!geoPlaces.length) return;
    mapRef.current?.fitToCoordinates(
      geoPlaces.map(p => ({ latitude: p.lat!, longitude: p.lng! })),
      { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true }
    );
  }, [places]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    const lat = toNum(place?.lat);
    const lng = toNum(place?.lng);
    if (lat != null && lng != null) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400
      );
    }
  }, [selectedPlaceId]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      showsUserLocation
    >
      {places
        .map(p => ({ ...p, lat: toNum(p.lat), lng: toNum(p.lng) }))
        .filter(p => p.lat != null && p.lng != null)
        .map(place => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat!, longitude: place.lng! }}
            title={place.name}
            pinColor={place.id === selectedPlaceId ? Colors.secondary : place.is_highlight ? Colors.accent : Colors.error}
            onPress={() => onMarkerPress(place.id)}
          />
        ))}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
