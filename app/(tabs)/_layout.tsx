import { Tabs } from "expo-router";
import { Bell, FileText, Home, Settings, Share2, Users } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.cardBackground,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tecnici"
        options={{
          title: "Tecnici",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Report",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: "Esporta",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <Share2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifiche"
        options={{
          title: "Notifiche",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Impostazioni",
          headerTitle: "R.I.S.O. Master",
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700" as const,
            fontSize: 20,
          },
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
