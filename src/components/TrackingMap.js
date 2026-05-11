import React from 'react';

import {
    Image,
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
    pathCoordinates,
    fullRouteCoordinates,
    destination,
    mapReady,
    setMapReady,
}) => {
    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            showsUserLocation
            showsMyLocationButton
            onMapReady={() => {
                setMapReady(true);
            }}>
            {/* FULL ROUTE */}
            {fullRouteCoordinates.length >
                1 && (
                    <Polyline
                        coordinates={
                            fullRouteCoordinates
                        }
                        strokeWidth={5}
                        strokeColor="#BDBDBD"
                    />
                )}

            {/* COMPLETED ROUTE */}
            {pathCoordinates.length > 1 && (
                <Polyline
                    coordinates={pathCoordinates}
                    strokeWidth={5}
                    strokeColor="#1DB954"
                />
            )}

            {/* DELIVERY BOY */}
            <Marker.Animated
                coordinate={animatedCoordinate}>
                <Image
                    source={require('../assets/bike.png')}
                    style={styles.bikeIcon}
                    resizeMode="contain"
                />
            </Marker.Animated>

            {/* DESTINATION */}
            <Marker coordinate={destination}>
                <Image
                    source={require('../assets/home.png')}
                    style={styles.homeIcon}
                    resizeMode="contain"
                />
            </Marker>
        </MapView>
    );
};

export default TrackingMap;

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    bikeIcon: {
        width: 45,
        height: 45,
    },

    homeIcon: {
        width: 38,
        height: 38,
    },
});