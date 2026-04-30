import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import CreateWorkoutScreen from '../screens/CreateWorkoutScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';

const Stack = createNativeStackNavigator();

export default function WorkoutsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="WorkoutList" component={WorkoutsScreen} />
            <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
            <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Workout' }} />
        </Stack.Navigator>
    );
}