import React from 'react';

import {
    Image,
    View,
    StyleSheet,
} from 'react-native';

import MapView, {
    Marker,
    Polyline,
} from 'react-native-maps';

import {
    DEFAULT_REGION,
} from '../utils/constants';

const TrackingMap = ({
    mapRef,
    animatedCoordinate,
    completedPath = [],
    fullRouteCoordinates = [],
    destination,
    mapReady,
    setMapReady,
}) => {
    const remainingRoute =
        fullRouteCoordinates.slice(
            completedPath.length > 0
                ? completedPath.length - 1
                : 0,
        );

    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
                latitude:
                    fullRouteCoordinates?.[0]
                        ?.latitude ||
                    DEFAULT_REGION.latitude,

                longitude:
                    fullRouteCoordinates?.[0]
                        ?.longitude ||
                    DEFAULT_REGION.longitude,

                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
            onMapReady={() => {
                setMapReady(true);
            }}
        >
            {/* REMAINING ROUTE */}
            {remainingRoute.length > 1 && (
                <Polyline
                    coordinates={remainingRoute}
                    strokeWidth={5}
                    strokeColor="#BDBDBD"
                />
            )}

            {/* COMPLETED ROUTE */}
            {completedPath.length > 1 && (
                <Polyline
                    coordinates={completedPath}
                    strokeWidth={6}
                    strokeColor="#1DB954"
                />
            )}

            {/* STORE */}
            {fullRouteCoordinates.length >
                0 && (
                    <Marker
                        coordinate={
                            fullRouteCoordinates[0]
                        }
                        anchor={{
                            x: 0.5,
                            y: 0.5,
                        }}
                    >
                        <View style={styles.startDot} />
                    </Marker>
                )}

            {/* DELIVERY BOY */}
            <Marker.Animated
                coordinate={animatedCoordinate}
                flat
                anchor={{
                    x: 0.5,
                    y: 0.5,
                }}
            >
                <Image
                    source={require('../assets/bike.png')}
                    style={styles.bikeIcon}
                />
            </Marker.Animated>

            {/* CUSTOMER HOME */}
            {destination && (
                <Marker coordinate={destination}>
                    <Image
                        source={require('../assets/home.png')}
                        style={styles.homeIcon}
                    />
                </Marker>
            )}
        </MapView>
    );
};

export default TrackingMap;

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    bikeIcon: {
        width: 42,
        height: 42,
        resizeMode: 'contain',
    },

    homeIcon: {
        width: 38,
        height: 38,
        resizeMode: 'contain',
    },

    startDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#fff',
    },
});