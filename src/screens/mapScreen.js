import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';

import MapView, {
  Marker,
  Polyline,
  AnimatedRegion,
} from 'react-native-maps';

import Geolocation from '@react-native-community/geolocation';

import { supabase } from '../services/supabase';

const DEFAULT_REGION = {
  latitude: 23.2599,
  longitude: 77.4126,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const DEMO_ROUTE = [
  {
    latitude: 23.2599,
    longitude: 77.4126,
  },
  {
    latitude: 23.2605,
    longitude: 77.4135,
  },
  {
    latitude: 23.2612,
    longitude: 77.4144,
  },
  {
    latitude: 23.2620,
    longitude: 77.4152,
  },
  {
    latitude: 23.2630,
    longitude: 77.4160,
  },
  {
    latitude: 23.2640,
    longitude: 77.4170,
  },
];

const MapScreen = () => {
  const mapRef = useRef(null);

  // ANIMATED MARKER
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: DEFAULT_REGION.latitude,
      longitude: DEFAULT_REGION.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  // TRACKING STATES
  const [mapReady, setMapReady] = useState(false);

  const [isTracking, setIsTracking] = useState(false);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [pathCoordinates, setPathCoordinates] =
    useState([]);

  // WATCHER REF
  const watchIdRef = useRef(null);

  const simulationRef = useRef(null);

  // GEOLOCATION CONFIG
  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }, []);

  // CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(
          watchIdRef.current,
        );

        console.log(
          'Watcher cleared on unmount',
        );
      }
    };
  }, []);

  // DISTANCE CALCULATOR
  const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2,
  ) => {
    const toRad = value =>
      (value * Math.PI) / 180;

    const R = 6371e3;

    const φ1 = toRad(lat1);

    const φ2 = toRad(lat2);

    const Δφ = toRad(lat2 - lat1);

    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) *
      Math.sin(Δφ / 2) +
      Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      );

    return R * c;
  };

  // LOCATION PERMISSION
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .ACCESS_FINE_LOCATION,
          );

        return (
          granted ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      }

      return true;
    } catch (error) {
      console.log(
        'PERMISSION ERROR => ',
        error,
      );

      return false;
    }
  };

  // START LIVE TRACKING
  const startLiveTracking = async () => {
    try {
      if (isTracking) {
        console.log(
          'Tracking already running',
        );

        return;
      }

      const hasPermission =
        await requestLocationPermission();

      if (!hasPermission) {
        console.log('Permission denied');

        return;
      }

      setIsTracking(true);

      const watchId =
        Geolocation.watchPosition(
          position => {
            console.log(
              'LIVE POSITION => ',
              position,
            );

            if (!position?.coords) {
              return;
            }

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            const newCoordinate = {
              latitude,
              longitude,
            };

            // ANTI-JITTER PROTECTION
            if (currentLocation) {
              const distance =
                calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  latitude,
                  longitude,
                );

              // IGNORE VERY SMALL MOVEMENTS
              if (distance < 3) {
                return;
              }
            }

            // UPDATE CURRENT LOCATION
            setCurrentLocation(newCoordinate);

            // SMOOTH MARKER ANIMATION
            animatedCoordinate
              .timing({
                latitude,
                longitude,
                duration: 2000,
                useNativeDriver: false,
              })
              .start();

            // UPDATE ROLLING PATH BUFFER
            setPathCoordinates(prev => {
              const updated = [
                ...prev,
                newCoordinate,
              ];

              // KEEP ONLY LAST 5 POINTS
              if (updated.length > 5) {
                updated.shift();
              }

              return updated;
            });

            // CAMERA FOLLOW
            if (
              mapReady &&
              mapRef.current
            ) {
              mapRef.current.animateToRegion(
                {
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000,
              );
            }
          },

          error => {
            console.log(
              'WATCH ERROR => ',
              error,
            );
          },

          {
            enableHighAccuracy: false,

            // FOR TESTING PURPOSE
            distanceFilter: 0,
            interval: 2000,
            fastestInterval: 1000,
          },
        );

      watchIdRef.current = watchId;

      console.log(
        'TRACKING STARTED => ',
        watchId,
      );
    } catch (error) {
      console.log(
        'START TRACKING ERROR => ',
        error,
      );
    }
  };

  // STOP LIVE TRACKING
  const stopLiveTracking = () => {
    try {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(
          watchIdRef.current,
        );

        watchIdRef.current = null;
      }

      if (simulationRef.current) {
        clearInterval(simulationRef.current);

        simulationRef.current = null;
      }

      setIsTracking(false);

      console.log('Tracking stopped');
    } catch (error) {
      console.log(
        'STOP TRACKING ERROR => ',
        error,
      );
    }
  };

  // DEMO TRACKING
  const startDemoTracking = () => {
    try {
      if (isTracking) {
        return;
      }

      console.log('DEMO TRACKING STARTED');

      setIsTracking(true);

      let currentIndex = 0;

      simulationRef.current = setInterval(() => {
        if (
          currentIndex >= DEMO_ROUTE.length
        ) {
          clearInterval(
            simulationRef.current,
          );

          simulationRef.current = null;

          setIsTracking(false);

          console.log(
            'DEMO TRACKING COMPLETED',
          );

          return;
        }

        const coordinate =
          DEMO_ROUTE[currentIndex];

        const latitude =
          coordinate.latitude;

        const longitude =
          coordinate.longitude;

        // UPDATE LOCATION
        setCurrentLocation(coordinate);

        // ANIMATE MARKER
        animatedCoordinate
          .timing({
            latitude,
            longitude,
            duration: 2000,
            useNativeDriver: false,
          })
          .start();

        // UPDATE POLYLINE
        setPathCoordinates(prev => {
          const updated = [
            ...prev,
            coordinate,
          ];

          if (updated.length > 5) {
            updated.shift();
          }

          return updated;
        });

        // CAMERA FOLLOW
        if (
          mapReady &&
          mapRef.current
        ) {
          mapRef.current.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }

        currentIndex++;
      }, 2500);
    } catch (error) {
      console.log(
        'DEMO TRACKING ERROR => ',
        error,
      );
    }
  };

  // TEST SUPABASE
  const testSupabaseConnection = async () => {
    try {
      console.log(
        'TESTING SUPABASE CONNECTION...',
      );

      const { data, error } = await supabase
        .from('tracking')
        .select('*');

      console.log(
        'SUPABASE DATA => ',
        data,
      );

      console.log(
        'SUPABASE ERROR => ',
        error,
      );
    } catch (error) {
      console.log(
        'SUPABASE TEST ERROR => ',
        error,
      );
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
        {/* ANIMATED RIDER MARKER */}
        {currentLocation && (
          <Marker.Animated
            coordinate={animatedCoordinate}
            title="Delivery Boy"
          />
        )}

        {/* MOVEMENT POLYLINE */}
        {pathCoordinates.length > 1 && (
          <Polyline
            coordinates={pathCoordinates}
            strokeWidth={5}
            strokeColor="red"
          />
        )}
      </MapView>

      <View style={styles.bottomContainer}>
        {/* LIVE TRACK BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                isTracking
                  ? 'red'
                  : 'black',
            },
          ]}
          activeOpacity={0.8}
          onPress={
            isTracking
              ? stopLiveTracking
              : startLiveTracking
          }>
          <Text style={styles.buttonText}>
            {isTracking
              ? 'Stop Tracking'
              : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        {/* DEMO TRACK BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: 'blue',
            },
          ]}
          activeOpacity={0.8}
          onPress={startDemoTracking}>
          <Text style={styles.buttonText}>
            Start Demo Tracking
          </Text>
        </TouchableOpacity>

        {/* TEST SUPABASE BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: 'green',
            },
          ]}
          activeOpacity={0.8}
          onPress={testSupabaseConnection}>
          <Text style={styles.buttonText}>
            Test Supabase
          </Text>
        </TouchableOpacity>

        {/* COORDINATES */}
        <Text style={styles.coordText}>
          Latitude:{' '}
          {currentLocation?.latitude ??
            'Not Available'}
        </Text>

        <Text style={styles.coordText}>
          Longitude:{' '}
          {currentLocation?.longitude ??
            'Not Available'}
        </Text>

        {/* TRACKING STATUS */}
        <Text style={styles.statusText}>
          Tracking Status:{' '}
          {isTracking
            ? 'ACTIVE'
            : 'STOPPED'}
        </Text>

        {/* PATH COUNT */}
        <Text style={styles.statusText}>
          Path Points:{' '}
          {pathCoordinates.length}
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
    marginBottom: 6,
    color: '#000',
  },

  statusText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
    color: '#000',
  },
});