import Geolocation from '@react-native-community/geolocation';

export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,
                });
            },

            error => {
                reject(error);
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 5000,
            },
        );
    });
};