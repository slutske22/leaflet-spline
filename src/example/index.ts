import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./styles.css";
import "../index";
import { shape1, shape2, TILE_LAYER_URL } from "./constants";

export const map = L.map("map", {
  center: [1, -5],
  zoom: 9,
});

L.tileLayer(TILE_LAYER_URL).addTo(map);

// shape1.asPolyline().addTo(map);
// shape2.asPolyline().addTo(map);

L.spline(shape1.coords).addTo(map);
