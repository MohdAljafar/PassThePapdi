
import { Fragment, useEffect } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { formatDate } from "../lib/api";

// Colour palette for gift locations
const GIFT_COLORS = [
  "#FF4D8D",
  "#A855F7",
  "#00BFA6",
  "#FF9F1C",
  "#4385FF",
  "#E84393",
  "#8BC34A",
  "#FF5E3A",
  "#00A8E8",
  "#D4A5FF",
];

function getGiftColor(boxId) {
  const value = String(boxId || "gift");

  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const hue = (hash >>> 0) % 360;

  return `hsl(${hue}, 90%, 55%)`;
}

// India bounding box
const INDIA_BOUNDS = [
  [6.5, 68.0],
  [37.2, 97.5],
];

// Always show the complete India map initially
function FitIndia() {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();

      map.fitBounds(INDIA_BOUNDS, {
        padding: [12, 12],
        // maxZoom: 5,
        animate: false,
      });
    };

    fit();

    const timer = setTimeout(fit, 200);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function GiftMap({
  locations = [],
  className = "aspect-square w-full",
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-line ${className}`}
    >
      <MapContainer
        center={[22, 82]}
        zoom={4}
        scrollWheelZoom={true}
        className="absolute inset-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            Math.abs(lat) > 90 ||
            Math.abs(lng) > 180
          ) {
            return null;
          }

          const color = getGiftColor(item.boxId || item.id);
          const radius = Number(item.radiusMeters) || 1000;

          return (
            <Fragment key={item.id}>


              {/* Main 1 km colourful circle */}
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color,
                  opacity: 0.5,
                  fillColor: color,
                  fillOpacity: 0.40,
                }}
              />

              

              {/* Bright centre marker */}
              <CircleMarker
                center={[lat, lng]}
                radius={3}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 3,
                  fillColor: color,
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="min-w-32">
                    <strong>
                      {item.recipientName || "A club member"}
                    </strong>
                    <br />
                    {item.box?.boxCode || "Soan Papdi gift"}
                    <br />
                    <small>
                      {formatDate(item.acceptedAt)}
                    </small>
                    <br />
                    <small>Approximate 1 km circle</small>
                  </div>
                </Popup>
              </CircleMarker>

            </Fragment>
          );
        })}

        <FitIndia />
      </MapContainer>
    </div>
  );
}
