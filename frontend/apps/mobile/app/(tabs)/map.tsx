import { useActors } from "@yuni/api-client/react";
import type { MapActor } from "@yuni/api-client";
import { useAuth } from "@yuni/auth";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";

import ActorBottomSheet from "@/components/map/ActorBottomSheet";
import { MapFloatingActions } from "@/components/map/MapFloatingActions";
import { DEFAULT_CITY_SLUG } from "@/lib/constants";
import { haversineKm } from "@/lib/geoDistance";

const REIMS_REGION: Region = {
  latitude: 49.2583,
  longitude: 4.0317,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const CATEGORY_COLORS: Record<string, string> = {
  sport: "#2D6A4F",
  culture: "#4A6FA5",
  environnement: "#72B885",
  famille: "#F0946A",
  tech: "#6B8CFF",
  musique: "#4A6FA5",
  civic: "#6B8CFF",
  default: "#C1440E",
};

export default function MapScreen() {
  const { token } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [selectedActor, setSelectedActor] = useState<MapActor | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const { data, isLoading } = useActors(DEFAULT_CITY_SLUG, Boolean(token));
  const actors = data?.actors ?? [];

  const distanceKm =
    userPos && selectedActor
      ? haversineKm(
          userPos.lat,
          userPos.lng,
          selectedActor.geo.lat,
          selectedActor.geo.lng,
        )
      : null;

  const goMyLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    setUserPos({ lat, lng });
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      500,
    );
  }, []);

  return (
    <View style={styles.container}>
      {!token ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Connecte-toi pour charger les acteurs sur la carte.
          </Text>
        </View>
      ) : null}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#C1440E" />
        </View>
      ) : null}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={REIMS_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {actors.map((actor) => {
          const color =
            CATEGORY_COLORS[actor.category.toLowerCase()] ??
            CATEGORY_COLORS.default;
          return (
            <Marker
              key={actor.id}
              coordinate={{
                latitude: actor.geo.lat,
                longitude: actor.geo.lng,
              }}
              onPress={() => setSelectedActor(actor)}
              tracksViewChanges={false}
            >
              <View style={[styles.marker, { backgroundColor: color }]}>
                <Text style={styles.markerText}>
                  {actor.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <Pressable
        accessibilityLabel="Centrer sur ma position"
        style={styles.locationBtn}
        onPress={goMyLocation}
      >
        <Text style={styles.locationEmoji}>📍</Text>
      </Pressable>

      <MapFloatingActions />

      <ActorBottomSheet
        actor={selectedActor}
        distanceKm={distanceKm}
        onClose={() => setSelectedActor(null)}
        onVoiceGuide={() => {
          setSelectedActor(null);
          router.push("/(modals)/voice");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    padding: 10,
    backgroundColor: "#FDFAF5ee",
  },
  bannerText: { color: "#8B2F08", textAlign: "center", fontSize: 13 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  locationBtn: {
    position: "absolute",
    bottom: 100,
    right: 16,
    backgroundColor: "white",
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 3,
  },
  locationEmoji: { fontSize: 22 },
});
