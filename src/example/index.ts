import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import "./styles.css";
import { shape1, shape2, TILE_LAYER_URL } from "./constants";

import { spline } from "..";

export const map = L.map("map", {
  center: [2, -5],
  zoom: 8,
});

L.tileLayer(TILE_LAYER_URL).addTo(map);

shape1.asPolyline().addTo(map);
// shape2.asPolyline().addTo(map);

const mySpline = spline(shape1.coords, { color: "yellow" }).addTo(map);
// @ts-expect-error
window.mySpline = mySpline;
