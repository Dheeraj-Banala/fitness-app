import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FoodLogScreen from "../screens/FoodLogScreen";
import AddFoodScreen from '../screens/AddFoodScreen';
import MicronutrientsScreen from '../screens/MicronutrientsScreen';

const Stack = createNativeStackNavigator();

export default function FoodLogStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="FoodLog" component={FoodLogScreen} />
            <Stack.Screen name="AddFood" component={AddFoodScreen} />
            <Stack.Screen name="Micronutrients" component={MicronutrientsScreen} options={{ title: 'Micronutrients' }} />
        </Stack.Navigator>
    );
}