import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import "@elfalem/leaflet-curve"; // need this why???
import "./styles.css";
import { shape1, shape2, TILE_LAYER_URL } from "./constants";

import { spline } from "..";

export const map = L.map("map", {
  center: [2, -5],
  zoom: 8,
});

L.tileLayer(TILE_LAYER_URL).addTo(map);

shape1.asPolyline().addTo(map);
shape2.asPolyline().addTo(map);

const mySpline1 = spline(shape1.coords, { color: "yellow" }).addTo(map);
const mySpline2 = spline(shape2.coords, { color: "yellow" }).addTo(map);

// @ts-expect-error
window.mySpline1 = mySpline1;
// @ts-expect-error
window.mySpline2 = mySpline2;
