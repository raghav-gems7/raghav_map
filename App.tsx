import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './src/screens/MainScreen';

import DeliveryTrackingScreen from './src/screens/DeliveryTrackingScreen';

import CustomerTrackingScreen from './src/screens/CustomerTrackingScreen';

const Stack =
  createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
        }}>
        <Stack.Screen
          name="MainScreen"
          component={MainScreen}
          options={{
            title: 'Tracking System',
          }}
        />

        <Stack.Screen
          name="DeliveryTrackingScreen"
          component={
            DeliveryTrackingScreen
          }
          options={{
            title:
              'Delivery Boy Module',
          }}
        />

        <Stack.Screen
          name="CustomerTrackingScreen"
          component={
            CustomerTrackingScreen
          }
          options={{
            title: 'Customer Module',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;