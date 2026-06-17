import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UserSelectionScreen from '../screens/UserSelectionScreen';
import DeliveryHomeScreen from '../screens/DeliveryHomeScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import CustomerTrackingScreen from '../screens/CustomerTrackingScreen';
import DairyOwnerMapScreen from '../screens/DairyOwnerMapScreen';
import DeliveryMapScreen from '../screens/DeliveryMapScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerTintColor: '#111111',
                }}
            >
                <Stack.Screen
                    name="UserSelectionScreen"
                    component={UserSelectionScreen}
                    options={{ title: 'Dairy Delivery' }}
                />
                <Stack.Screen
                    name="DeliveryHomeScreen"
                    component={DeliveryHomeScreen}
                    options={{ title: 'My Deliveries' }}
                />
                <Stack.Screen
                    name="CustomerHomeScreen"
                    component={CustomerHomeScreen}
                    options={{ title: 'My Orders' }}
                />
                <Stack.Screen
                    name="CustomerTrackingScreen"
                    component={CustomerTrackingScreen}
                    options={{ title: 'Track Delivery' }}
                />
                <Stack.Screen
                    name="DairyOwnerMapScreen"
                    component={DairyOwnerMapScreen}
                    options={{ title: 'Live Operations' }}
                />
                <Stack.Screen
                    name="DeliveryMapScreen"
                    component={DeliveryMapScreen}
                    options={{ title: 'Delivery Map' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
