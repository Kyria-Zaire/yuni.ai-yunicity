import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="voice"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="report"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Signalement",
        }}
      />
    </Stack>
  );
}
