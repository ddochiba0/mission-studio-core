import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { MapAuthoringProps, MapSelection } from "@mission-studio/map-contracts";
import "leaflet/dist/leaflet.css";

export function LeafletMissionMap({ points, initialViewport, readOnly = false, onSelect }: MapAuthoringProps) {
  const center: [number, number] = [initialViewport.center.latitude, initialViewport.center.longitude];
  return <MapContainer center={center} zoom={initialViewport.zoom} scrollWheelZoom className="map">
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {!readOnly && onSelect && <ClickSelection onSelect={onSelect} />}
    <FitPoints points={points} />
    {points.map((point) => <CircleMarker key={point.id} center={[point.position.latitude, point.position.longitude]} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#b06b25", fillOpacity: 1 }}>
      <Tooltip permanent direction="top">{point.sequence}. {point.label}</Tooltip>
    </CircleMarker>)}
  </MapContainer>;
}

function ClickSelection({ onSelect }: { onSelect: (selection: MapSelection) => void }) {
  useMapEvents({ click(event) { onSelect({ position: { latitude: event.latlng.lat, longitude: event.latlng.lng } }); } });
  return null;
}

function FitPoints({ points }: Pick<MapAuthoringProps, "points">) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView([points[0]!.position.latitude, points[0]!.position.longitude], Math.max(map.getZoom(), 15));
    else map.fitBounds(points.map((point) => [point.position.latitude, point.position.longitude]), { padding: [36, 36], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export type * from "@mission-studio/map-contracts";
