import React from 'react';

import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import ModuleButton from '../components/ModuleButton';

const MainScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Live Tracking System
            </Text>

            <ModuleButton
                title="Delivery Boy Module"
                color="black"
                onPress={() =>
                    navigation.navigate(
                        'DeliveryTrackingScreen',
                    )
                }
            />

            <ModuleButton
                title="Customer Module"
                color="green"
                onPress={() =>
                    navigation.navigate(
                        'CustomerTrackingScreen',
                    )
                }
            />
        </View>
    );
};

export default MainScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 40,
        textAlign: 'center',
    },
});