import { useEffect } from "react";
import { Circle, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

function FitLocations({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (!locations.length) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }
    const points = locations
      .map((item) => [Number(item.latitude), Number(item.longitude)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180);
    if (points.length === 1) map.setView(points[0], 10);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 10 });
  }, [locations, map]);
  return null;
}

export default function GiftMap({ locations = [], className = "h-[430px]" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line ${className}`}>
      <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
          return (
            <Circle
              key={item.id}
              center={[lat, lng]}
              radius={Number(item.radiusMeters) || 5000}
              pathOptions={{ color: "#174c3b", weight: 2, fillColor: "#bd8736", fillOpacity: 0.18 }}
            >
              <></>
            </Circle>
          );
        })}
        {locations.map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
          return (
            <Circle
              key={`${item.id}-pin`}
              center={[lat, lng]}
              radius={120}
              pathOptions={{ color: "#fffdf9", weight: 3, fillColor: "#174c3b", fillOpacity: 1 }}
            >
              <></>
            </Circle>
          );
        })}
        <FitLocations locations={locations} />
      </MapContainer>
    </div>
  );
}
