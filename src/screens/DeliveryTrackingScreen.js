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
  DEFAULT_REGION,
} from '../utils/constants';

import { calculateDistance } from '../utils/distance';

import { uploadTrackingData } from '../services/trackingService';

import { DEMO_ROUTE } from '../utils/DemoRoute';

const DeliveryTrackingScreen = () => {
  const mapRef = useRef(null);

  const watchIdRef = useRef(null);

  const demoIntervalRef = useRef(null);

  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: DEMO_ROUTE[0].latitude,
      longitude: DEMO_ROUTE[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  const [mapReady, setMapReady] =
    useState(false);

  const [isTracking, setIsTracking] =
    useState(false);

  const [currentLocation, setCurrentLocation] =
    useState(DEMO_ROUTE[0]);

  const [completedPath, setCompletedPath] =
    useState([DEMO_ROUTE[0]]);
  const [maxReachedRouteIndex, setMaxReachedRouteIndex] =
    useState(0);

  const travelledPathRef = useRef([DEMO_ROUTE[0]]);

  const findNearestRouteIndex = coordinate => {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    DEMO_ROUTE.forEach((routePoint, index) => {
      const distance = calculateDistance(
        coordinate.latitude,
        coordinate.longitude,
        routePoint.latitude,
        routePoint.longitude,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  // useEffect(() => {
  //   Geolocation.setRNConfiguration({
  //     skipPermissionRequests: false,
  //     authorizationLevel: 'whenInUse',
  //   });

  //   return () => {
  //     stopTracking();
  //   };
  // }, []);

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
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

  const uploadTracking = async (
    coordinate,
    updatedPath,
  ) => {
    try {
      const payload = {
        order_id: TEST_ORDER_ID,

        current_lat: coordinate.latitude,

        current_lng: coordinate.longitude,

        path_json: updatedPath,

        updated_at:
          new Date().toISOString(),
      };

      const { error } =
        await uploadTrackingData(payload);

      if (error) {
        console.log(
          'UPLOAD ERROR => ',
          error,
        );
      } else {
        console.log(
          'TRACKING UPLOADED',
        );
      }
    } catch (error) {
      console.log(
        'UPLOAD TRACKING ERROR => ',
        error,
      );
    }
  };

  const updateTrackingState = async (
    coordinate,
  ) => {
    try {
      const latitude =
        coordinate.latitude;

      const longitude =
        coordinate.longitude;

      setCurrentLocation(coordinate);

      animatedCoordinate
        .timing({
          latitude,
          longitude,
          duration: 4000,
          useNativeDriver: false,
        })
        .start();

      travelledPathRef.current = [
        ...travelledPathRef.current,
        coordinate,
      ];

      const nearestRouteIndex =
        findNearestRouteIndex(coordinate);

      const nextMaxReachedRouteIndex = Math.max(
        maxReachedRouteIndex,
        nearestRouteIndex,
      );

      if (
        nextMaxReachedRouteIndex !==
        maxReachedRouteIndex
      ) {
        setMaxReachedRouteIndex(
          nextMaxReachedRouteIndex,
        );
      }

      const updatedPath = DEMO_ROUTE.slice(
        0,
        nextMaxReachedRouteIndex + 1,
      );

      setCompletedPath(updatedPath);

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

      await uploadTracking(
        coordinate,
        updatedPath,
      );
    } catch (error) {
      console.log(
        'UPDATE TRACKING ERROR => ',
        error,
      );
    }
  };

  const startTracking = async () => {
    try {
      if (isTracking) {
        return;
      }

      const granted =
        await requestPermission();

      if (!granted) {
        return;
      }

      setIsTracking(true);

      const watchId =
        Geolocation.watchPosition(
          async position => {
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

            await updateTrackingState(
              newCoordinate,
            );
          },

          error => {
            console.log(
              'GPS ERROR => ',
              error,
            );
          },

          {
            enableHighAccuracy: false,
            distanceFilter: 0,
            interval: 2000,
            fastestInterval: 1000,
          },
        );

      watchIdRef.current = watchId;
    } catch (error) {
      console.log(
        'START TRACKING ERROR => ',
        error,
      );
    }
  };

  const startDemoTracking = () => {
    try {
      if (isTracking) {
        return;
      }

      console.log(
        'DEMO TRACKING STARTED',
      );

      setCompletedPath([
        DEMO_ROUTE[0],
      ]);
      travelledPathRef.current = [DEMO_ROUTE[0]];
      setMaxReachedRouteIndex(0);

      setCurrentLocation(
        DEMO_ROUTE[0],
      );

      animatedCoordinate.setValue({
        latitude:
          DEMO_ROUTE[0].latitude,

        longitude:
          DEMO_ROUTE[0].longitude,

        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setIsTracking(true);

      let currentIndex = 1;

      demoIntervalRef.current =
        setInterval(async () => {
          if (
            currentIndex >=
            DEMO_ROUTE.length
          ) {
            clearInterval(
              demoIntervalRef.current,
            );

            demoIntervalRef.current =
              null;

            setIsTracking(false);

            console.log(
              'DEMO TRACKING COMPLETED',
            );

            return;
          }

          const coordinate =
            DEMO_ROUTE[currentIndex];

          await updateTrackingState(
            coordinate,
          );

          currentIndex++;
        }, TRACKING_INTERVAL);
    } catch (error) {
      console.log(
        'DEMO TRACKING ERROR => ',
        error,
      );
    }
  };

  const stopTracking = () => {
    try {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(
          watchIdRef.current,
        );
      }

      if (demoIntervalRef.current) {
        clearInterval(
          demoIntervalRef.current,
        );
      }

      setIsTracking(false);

      console.log('TRACKING STOPPED');
    } catch (error) {
      console.log(
        'STOP TRACKING ERROR => ',
        error,
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TrackingMap
        mapRef={mapRef}
        animatedCoordinate={
          animatedCoordinate
        }
        completedPath={
          completedPath
        }
        fullRouteCoordinates={
          DEMO_ROUTE
        }
        destination={
          DEMO_ROUTE[
          DEMO_ROUTE.length - 1
          ]
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
              : 'Start GPS Tracking'
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

        <ModuleButton
          title="Start Demo Tracking"
          color="blue"
          onPress={startDemoTracking}
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
