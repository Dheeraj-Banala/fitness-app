import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FoodLogScreen from '../screens/FoodLogScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen'
import WeightScreen from '../screens/WeightScreen';
import WaterScreen from '../screens/WaterScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Food Log" component={FoodLogScreen} />
            <Tab.Screen name="Workouts" component={WorkoutsScreen} />
            <Tab.Screen name="Weight" component={WeightScreen} />
            <Tab.Screen name="Water" component={WaterScreen} />
            <Tab.Screen name="Goals" component={GoalsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}