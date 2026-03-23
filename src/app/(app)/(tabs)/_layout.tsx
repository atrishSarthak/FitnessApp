import React from 'react'
import { Tabs } from 'expo-router'
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';


function Layout() {
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
                name="profile/index"
                options={{
                    headerShown: false,
                    title: "Profile",
                    /*tabBarIcon: ({ color, size }) => (
                        <Image
                            source={require("../../assets/images/profile.png")}
                            style={{ width: size, height: size, borderRadius: size / 2 }}
                        />
                    )*/
                }}
            />


        </Tabs>
    )
}

export default Layout