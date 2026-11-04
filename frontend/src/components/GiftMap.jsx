import { Fragment, useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { formatDate } from "../lib/api";
import L from "leaflet";

function FitLocations({ locations }) {
  const map = useMap();
  useEffect(() => {
    const points = locations
      .map((item) => [Number(item.latitude), Number(item.longitude)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180);
    if (!points.length) map.setView([20.5937, 78.9629], 5);
    else if (points.length === 1) map.setView(points[0], 10);
    else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 10 });
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
            <Fragment key={item.id}>
              <Circle
                center={[lat, lng]}
                radius={Number(item.radiusMeters) || 5000}
                pathOptions={{ color: "#174c3b", weight: 2, fillColor: "#bd8736", fillOpacity: 0.18 }}
              />
              <CircleMarker
                center={[lat, lng]}
                radius={7}
                pathOptions={{ color: "#fffdf9", weight: 3, fillColor: "#174c3b", fillOpacity: 1 }}
              >
                <Popup>
                  <div className="min-w-32">
                    <strong>{item.recipientName || "A club member"}</strong>
                    <div>{item.box?.boxCode || "Soan Papdi gift"}</div>
                    <small>{formatDate(item.acceptedAt)} · Approximate 5 km circle</small>
                  </div>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
        <FitLocations locations={locations} />
      </MapContainer>
    </div>
  );
}