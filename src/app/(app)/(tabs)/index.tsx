import { Link } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Page() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Content />
    </SafeAreaView>
  );
}

function Content() {
  return (
    <View style={styles.contentWrapper}>
      <View style={styles.contentInner}>

        <Text style={styles.title}>
          Expo + Tailwind (NativeWind) Template
        </Text>

        <Text style={styles.subtitle}>
          This template sets up Expo and Tailwind (NativeWind) allowing you
          to quickly get started with my YouTube tutorial!
        </Text>

        <Link href="https://www.youtube.com/@sonnysangha" target="_blank">
          <Text className="text-lg text-center text-blue-500 underline">
            https://www.youtube.com/@sonnysangha
          </Text>
        </Link>

        <View style={styles.buttonsWrapper}>
          <Link
            suppressHighlighting
            className="flex h-9 items-center justify-center overflow-hidden rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50"
            href="https://www.youtube.com/@sonnysangha"
          >
            Visit my YouTube Channel
          </Link>

          <Link
            suppressHighlighting
            className="flex h-9 items-center justify-center overflow-hidden rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-gray-50"
            href="https://www.papareact.com/course"
          >
            Get the Complete Source Code (Plus 60+ builds) ❤️
          </Link>

          <Link
            suppressHighlighting
            className="flex h-9 items-center justify-center overflow-hidden rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-gray-50"
            href="https://www.papareact.com/course"
          >
            Join My Course & Learn to Code with AI 💚 (1000+ Students)
          </Link>
        </View>

      </View>
    </View>
  );
}

function Header() {
  return (
    <View>
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between">
        <Link className="font-bold flex-1 items-center justify-center" href="/">
          PAPAFAM
        </Link>
        <View>
          <Link
            className="text-md font-medium hover:underline web:underline-offset-4"
            href="https://www.papareact.com/course"
          >
            Join My Course ❤️
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  contentInner: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    maxWidth: 340,
    lineHeight: 24,
  },
  buttonsWrapper: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
});
