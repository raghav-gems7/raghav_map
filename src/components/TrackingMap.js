import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { DEFAULT_REGION } from '../utils/constants';

const TrackingMap = ({
    mapRef,
    animatedCoordinate,
    completedPath = [],
    fullRouteCoordinates = [],
    destination,
    setMapReady,
}) => {
    // Slice remaining route from the last completed point onward.
    // Guard against empty completedPath to avoid negative index.
    const sliceFrom = completedPath.length > 1 ? completedPath.length - 1 : 0;
    const remainingRoute = fullRouteCoordinates.slice(sliceFrom);

    const initialRegion = {
        latitude: fullRouteCoordinates[0]?.latitude ?? DEFAULT_REGION.latitude,
        longitude: fullRouteCoordinates[0]?.longitude ?? DEFAULT_REGION.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onMapReady={() => setMapReady(true)}
        >
            {/* Remaining (predicted) route — grey */}
            {remainingRoute.length > 1 && (
                <Polyline
                    coordinates={remainingRoute}
                    strokeWidth={5}
                    strokeColor="#BDBDBD"
                />
            )}

            {/* Completed path — green */}
            {completedPath.length > 1 && (
                <Polyline
                    coordinates={completedPath}
                    strokeWidth={6}
                    strokeColor="#1DB954"
                />
            )}

            {/* Origin dot (store/start) */}
            {fullRouteCoordinates.length > 0 && (
                <Marker
                    coordinate={fullRouteCoordinates[0]}
                    anchor={{ x: 0.5, y: 0.5 }}
                >
                    <View style={styles.startDot} />
                </Marker>
            )}

            {/* Animated delivery boy marker */}
            <Marker.Animated
                coordinate={animatedCoordinate}
                flat
                anchor={{ x: 0.5, y: 0.5 }}
            >
                <Image
                    source={require('../assets/bike.png')}
                    style={styles.bikeIcon}
                />
            </Marker.Animated>

            {/* Customer home marker */}
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
        backgroundColor: '#000000',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
});
