import React from 'react';

import MapView, {
    Marker,
    Polyline,
} from 'react-native-maps';

import {
    DESTINATION,
    DEFAULT_REGION,
} from '../utils/constants';

const TrackingMap = ({
    mapRef,
    animatedCoordinate,
    pathCoordinates,
    mapReady,
    setMapReady,
}) => {
    return (
        <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={DEFAULT_REGION}
            showsUserLocation
            showsMyLocationButton
            onMapReady={() => {
                setMapReady(true);
            }}>
            {/* DELIVERY BOY */}
            <Marker.Animated
                coordinate={animatedCoordinate}
                title="Delivery Boy"
            />

            {/* DESTINATION */}
            <Marker
                coordinate={DESTINATION}
                pinColor="green"
                title="Destination"
            />

            {/* POLYLINE */}
            {pathCoordinates.length > 1 && (
                <Polyline
                    coordinates={[
                        ...pathCoordinates,
                        DESTINATION,
                    ]}
                    strokeWidth={5}
                    strokeColor="red"
                />
            )}
        </MapView>
    );
};

export default TrackingMap;