import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const DEFAULT_REGION = {
  latitude: 23.2599,
  longitude: 77.4126,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapScreen = () => {
  const mapRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [mapReady, setMapReady] = useState(false);

  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      console.log('PERMISSION ERROR => ', error);
      return false;
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      if (loading) {
        return;
      }

      setLoading(true);

      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        console.log('Location permission denied');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        position => {
          console.log('POSITION => ', position);

          if (!position?.coords) {
            console.log('No coordinates found');
            setLoading(false);
            return;
          }

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          console.log('LATITUDE => ', latitude);
          console.log('LONGITUDE => ', longitude);

          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setCurrentLocation({
            latitude,
            longitude,
          });

          if (mapReady && mapRef.current) {
            setTimeout(() => {
              mapRef.current.animateToRegion(newRegion, 1000);
            }, 300);
          }

          setLoading(false);
        },

        error => {
          console.log('LOCATION ERROR => ', error);

          setLoading(false);
        },

        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.log('FETCH LOCATION ERROR => ', error);

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onMapReady={() => {
          console.log('MAP READY');
          setMapReady(true);
        }}>
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
          />
        )}
      </MapView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          disabled={loading}
          onPress={fetchCurrentLocation}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Fetch Current Location
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.coordText}>
          Latitude:{' '}
          {currentLocation?.latitude ?? 'Not Available'}
        </Text>

        <Text style={styles.coordText}>
          Longitude:{' '}
          {currentLocation?.longitude ?? 'Not Available'}
        </Text>
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  bottomContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  coordText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#000',
  },
});