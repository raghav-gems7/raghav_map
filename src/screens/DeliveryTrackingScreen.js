import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';

import { AnimatedRegion } from 'react-native-maps';

import TrackingMap from '../components/TrackingMap';

import ModuleButton from '../components/ModuleButton';

import {
  TEST_ORDER_ID,
  TRACKING_INTERVAL,
  MIN_DISTANCE_METERS,
  MAX_PATH_POINTS,
  DEFAULT_REGION,
} from '../utils/constants';

import { calculateDistance } from '../utils/distance';

import { uploadTrackingData } from '../services/trackingService';

const DeliveryTrackingScreen = () => {
  const mapRef = useRef(null);

  const uploadIntervalRef = useRef(null);

  const watchIdRef = useRef(null);

  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: DEFAULT_REGION.latitude,
      longitude: DEFAULT_REGION.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  const [mapReady, setMapReady] =
    useState(false);

  const [isTracking, setIsTracking] =
    useState(false);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [pathCoordinates, setPathCoordinates] =
    useState([]);

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });

    return () => {
      stopTracking();
    };
  }, []);

  const requestPermission = async () => {
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
  };

  const uploadTracking = async () => {
    try {
      if (!currentLocation) {
        return;
      }

      const payload = {
        order_id: TEST_ORDER_ID,

        current_lat:
          currentLocation.latitude,

        current_lng:
          currentLocation.longitude,

        path_json: pathCoordinates,

        updated_at:
          new Date().toISOString(),
      };

      const { error } =
        await uploadTrackingData(payload);

      if (error) {
        console.log(error);
      } else {
        console.log(
          'TRACKING UPLOADED',
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const startTracking = async () => {
    const granted =
      await requestPermission();

    if (!granted) {
      return;
    }

    setIsTracking(true);

    uploadIntervalRef.current =
      setInterval(() => {
        uploadTracking();
      }, TRACKING_INTERVAL);

    const watchId =
      Geolocation.watchPosition(
        position => {
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

          if (currentLocation) {
            const distance =
              calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                latitude,
                longitude,
              );

            if (
              distance <
              MIN_DISTANCE_METERS
            ) {
              return;
            }
          }

          setCurrentLocation(newCoordinate);

          animatedCoordinate
            .timing({
              latitude,
              longitude,
              duration: 2000,
              useNativeDriver: false,
            })
            .start();

          setPathCoordinates(prev => {
            const updated = [
              ...prev,
              newCoordinate,
            ];

            if (
              updated.length >
              MAX_PATH_POINTS
            ) {
              updated.shift();
            }

            return updated;
          });

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
          console.log(error);
        },

        {
          enableHighAccuracy: false,
          distanceFilter: 0,
          interval: 2000,
          fastestInterval: 1000,
        },
      );

    watchIdRef.current = watchId;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(
        watchIdRef.current,
      );
    }

    if (uploadIntervalRef.current) {
      clearInterval(
        uploadIntervalRef.current,
      );
    }

    setIsTracking(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <TrackingMap
        mapRef={mapRef}
        animatedCoordinate={
          animatedCoordinate
        }
        pathCoordinates={
          pathCoordinates
        }
        mapReady={mapReady}
        setMapReady={setMapReady}
      />

      <View style={styles.bottom}>
        <Text style={styles.title}>
          Delivery Boy Module
        </Text>

        <ModuleButton
          title={
            isTracking
              ? 'Stop Delivery'
              : 'Start Delivery'
          }
          color={
            isTracking
              ? 'red'
              : 'black'
          }
          onPress={
            isTracking
              ? stopTracking
              : startTracking
          }
        />
      </View>
    </View>
  );
};

export default DeliveryTrackingScreen;

const styles = StyleSheet.create({
  bottom: {
    padding: 16,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
});