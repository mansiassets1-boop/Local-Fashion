import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DeliveryMapProps {
  partnerLocation?: Coordinate;
  storeLocation?: Coordinate;
  destinationLocation?: Coordinate;
  showRoute?: boolean;
  style?: object;
}

export function DeliveryMap({
  partnerLocation,
  storeLocation,
  destinationLocation,
  showRoute = true,
  style,
}: DeliveryMapProps) {
  const mapRef = useRef<MapView>(null);

  const primaryTarget = destinationLocation ?? storeLocation;

  useEffect(() => {
    if (!mapRef.current) return;
    const coords: Coordinate[] = [];
    if (partnerLocation) coords.push(partnerLocation);
    if (storeLocation) coords.push(storeLocation);
    if (destinationLocation) coords.push(destinationLocation);

    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    } else if (coords.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...coords[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  }, [partnerLocation, storeLocation, destinationLocation]);

  const initialRegion: Region = {
    latitude: partnerLocation?.latitude ?? storeLocation?.latitude ?? 12.9716,
    longitude: partnerLocation?.longitude ?? storeLocation?.longitude ?? 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const routeCoords: Coordinate[] = [];
  if (partnerLocation) routeCoords.push(partnerLocation);
  if (destinationLocation) {
    if (storeLocation) routeCoords.push(storeLocation);
    routeCoords.push(destinationLocation);
  } else if (storeLocation) {
    routeCoords.push(storeLocation);
  }

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass
      showsTraffic={false}
    >
      {/* Partner (rider) pin */}
      {partnerLocation && (
        <Marker coordinate={partnerLocation} title="You" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.partnerPin}>
            <Ionicons name="bicycle" size={18} color="#fff" />
          </View>
        </Marker>
      )}

      {/* Store pin */}
      {storeLocation && (
        <Marker coordinate={storeLocation} title="Store">
          <View style={styles.storePin}>
            <Ionicons name="storefront" size={16} color="#fff" />
          </View>
        </Marker>
      )}

      {/* Customer / destination pin */}
      {destinationLocation && (
        <Marker coordinate={destinationLocation} title="Delivery">
          <View style={styles.destinationPin}>
            <Ionicons name="location" size={16} color="#fff" />
          </View>
        </Marker>
      )}

      {/* Route polyline */}
      {showRoute && routeCoords.length >= 2 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#4F46E5"
          strokeWidth={4}
          lineDashPattern={[8, 4]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  partnerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  storePin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  destinationPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});
