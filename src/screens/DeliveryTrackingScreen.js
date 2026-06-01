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
  ActivityIndicator,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';

import { AnimatedRegion } from 'react-native-maps';

import TrackingMap from '../components/TrackingMap';

import ModuleButton from '../components/ModuleButton';

import {
  TRACKING_INTERVAL,
  DEFAULT_REGION,
} from '../utils/constants';

import {
  uploadTrackingData,
} from '../services/trackingService';

import {
  getCurrentLocation,
} from '../services/deliveryService';

import {
  getRouteCoordinates,
} from '../services/googleMapService';

const DeliveryTrackingScreen = ({
  route,
}) => {
  const { order } = route.params;

  const mapRef = useRef(null);

  const watchIdRef = useRef(null);

  const demoIntervalRef = useRef(null);

  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude:
        DEFAULT_REGION.latitude,

      longitude:
        DEFAULT_REGION.longitude,

      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  const [loading, setLoading] =
    useState(true);

  const [mapReady, setMapReady] =
    useState(false);

  const [isTracking, setIsTracking] =
    useState(false);

  const [fullRoute, setFullRoute] =
    useState([]);

  const [completedPath,
    setCompletedPath,
  ] = useState([]);

  const [currentLocation,
    setCurrentLocation,
  ] = useState(null);

  useEffect(() => {
    initializeTracking();

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
        PermissionsAndroid.RESULTS
          .GRANTED
      );
    }

    return true;
  };

  const initializeTracking =
    async () => {
      try {
        setLoading(true);

        const granted =
          await requestPermission();

        if (!granted) {
          setLoading(false);
          return;
        }

        const origin =
          await getCurrentLocation();

        setCurrentLocation(origin);

        animatedCoordinate.setValue({
          latitude:
            origin.latitude,

          longitude:
            origin.longitude,

          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        const destination = {
          latitude:
            order.destination_lat,

          longitude:
            order.destination_lng,
        };

        const routeCoordinates =
          await getRouteCoordinates(
            origin,
            destination,
          );

        setFullRoute(
          routeCoordinates,
        );

        setCompletedPath([
          origin,
        ]);

        await uploadTrackingData({
          order_id: order.id,

          current_lat:
            origin.latitude,

          current_lng:
            origin.longitude,

          destination_lat:
            destination.latitude,

          destination_lng:
            destination.longitude,

          full_route:
            routeCoordinates,

          completed_path: [
            origin,
          ],

          updated_at:
            new Date().toISOString(),
        });

        setLoading(false);
      } catch (error) {
        console.log(error);

        setLoading(false);
      }
    };

  const uploadTracking =
    async coordinate => {
      try {
        const updatedPath = [
          ...completedPath,
          coordinate,
        ];

        setCompletedPath(
          updatedPath,
        );

        await uploadTrackingData({
          order_id: order.id,

          current_lat:
            coordinate.latitude,

          current_lng:
            coordinate.longitude,

          destination_lat:
            order.destination_lat,

          destination_lng:
            order.destination_lng,

          full_route:
            fullRoute,

          completed_path:
            updatedPath,

          updated_at:
            new Date().toISOString(),
        });
      } catch (error) {
        console.log(error);
      }
    };

  const startTracking =
    async () => {
      try {
        if (isTracking) {
          return;
        }

        setIsTracking(true);

        const watchId =
          Geolocation.watchPosition(
            async position => {
              const latitude =
                position.coords
                  .latitude;

              const longitude =
                position.coords
                  .longitude;

              const coordinate = {
                latitude,
                longitude,
              };

              setCurrentLocation(
                coordinate,
              );

              animatedCoordinate
                .timing({
                  latitude,
                  longitude,
                  duration: 4000,
                  useNativeDriver:
                    false,
                })
                .start();

              await uploadTracking(
                coordinate,
              );

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
              enableHighAccuracy:
                true,
              distanceFilter: 5,
              interval:
                TRACKING_INTERVAL,
              fastestInterval: 3000,
            },
          );

        watchIdRef.current =
          watchId;
      } catch (error) {
        console.log(error);
      }
    };

  const startDemoTracking =
    async () => {
      try {
        if (isTracking) {
          return;
        }

        setIsTracking(true);

        let currentIndex = 0;

        demoIntervalRef.current =
          setInterval(async () => {
            if (
              currentIndex >=
              fullRoute.length
            ) {
              clearInterval(
                demoIntervalRef.current,
              );

              setIsTracking(false);

              return;
            }

            const coordinate =
              fullRoute[currentIndex];

            animatedCoordinate
              .timing({
                latitude:
                  coordinate.latitude,

                longitude:
                  coordinate.longitude,

                duration: 4000,

                useNativeDriver:
                  false,
              })
              .start();

            setCurrentLocation(
              coordinate,
            );

            await uploadTracking(
              coordinate,
            );

            currentIndex++;
          }, TRACKING_INTERVAL);
      } catch (error) {
        console.log(error);
      }
    };

  const stopTracking = () => {
    if (watchIdRef.current) {
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
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#111111"
        />

        <Text style={styles.loaderText}>
          Preparing Route...
        </Text>
      </View>
    );
  }

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
          fullRoute
        }
        destination={{
          latitude:
            order.destination_lat,

          longitude:
            order.destination_lng,
        }}
        mapReady={mapReady}
        setMapReady={setMapReady}
      />

      <View style={styles.bottom}>
        <Text style={styles.orderId}>
          #{order.order_number}
        </Text>

        <Text style={styles.customer}>
          {order.customer_name}
        </Text>

        <Text style={styles.address}>
          {order.customer_address}
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
          color="#2563EB"
          onPress={
            startDemoTracking
          }
        />
      </View>
    </View>
  );
};

export default DeliveryTrackingScreen;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },

  bottom: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },

  orderId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },

  customer: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },

  address: {
    marginTop: 8,
    color: '#666666',
    marginBottom: 20,
  },
});