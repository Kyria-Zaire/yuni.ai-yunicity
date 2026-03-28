import { Tabs } from "expo-router";
import { Compass, Map, Mic, User } from "lucide-react-native";
import { View } from "react-native";

import { YuniVoiceFAB } from "@/components/YuniVoiceFAB";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: "#C1440E",
          tabBarInactiveTintColor: "#8E9BB0",
          tabBarStyle: {
            backgroundColor: "#FDFAF5",
            borderTopColor: "#EDD9A8",
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Accueil",
            tabBarIcon: ({ color }) => <Mic size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Carte",
            tabBarIcon: ({ color }) => <Map size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: "Quêtes",
            tabBarIcon: ({ color }) => <Compass size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Moi",
            tabBarIcon: ({ color }) => <User size={28} color={color} />,
          }}
        />
      </Tabs>
      <YuniVoiceFAB />
    </View>
  );
}
