import React from "react";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  children?: React.ReactNode;
  onPress?: () => void;
}

interface NativeMapProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  markers?: MapMarkerData[];
}

export function NativeMap({
  style,
  initialRegion,
  showsUserLocation,
  showsMyLocationButton,
  scrollEnabled,
  zoomEnabled,
  markers = [],
}: NativeMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      provider={PROVIDER_DEFAULT}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          onPress={marker.onPress}
        >
          {marker.children}
        </Marker>
      ))}
    </MapView>
  );
}
