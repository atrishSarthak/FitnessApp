import React from 'react'
import { Tabs } from 'expo-router'
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { useUser } from '@clerk/expo';
import { Image } from 'react-native';


function Layout() {
    const { user } = useUser();
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: false, title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <AntDesign name="home" size={size} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="exercises"
                options={{
                    headerShown: false,
                    title: "Exercises",
                    tabBarIcon: ({ color, size }) => (
                        <Entypo name="book" size={size} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="workout"
                options={{
                    headerShown: false,
                    title: "Workout",
                    tabBarIcon: ({ color, size }) => (
                        <AntDesign name="plus-circle" size={size} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="active-workout"
                options={{
                    headerShown: false,
                    title: "Active Workout",
                    href: null,
                    tabBarStyle: { display: "none" },
                }}
            />

            <Tabs.Screen
                name="history"
                options={{
                    headerShown: false,
                    title: "History",
                    tabBarIcon: ({ color, size }) => (
                        <AntDesign name="clock-circle" size={size} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                    <Image
                        source={{
                        uri: user?.imageUrl ?? user?.externalAccounts[0]?.imageUrl,
                        }}
                        className="rounded-full"
                        style={{ width: 28, height: 28, borderRadius: 100 }}
                    />
                    ),
                }}
            />
        </Tabs>
    )
}

export default Layout