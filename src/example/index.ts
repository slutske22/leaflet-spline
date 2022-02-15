import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "@elfalem/leaflet-curve"; // need this why???
import "./styles.css";
import { shape1, shape2, TILE_LAYER_URL } from "./constants";
import sample from "./sample.json";

import "..";

export const map = L.map("map", {
  center: [2, -5],
  zoom: 7,
});

map.createPane("splines");
(map.getPane("splines") as HTMLElement).style.zIndex = "650";

map.on("popupopen", () => {
  hljs.highlightAll();
});

L.tileLayer(TILE_LAYER_URL).addTo(map);

const s1 = shape1.asPolyline();
const s2 = shape2.asPolyline();
const originalShapes = L.layerGroup([s1, s2]).addTo(map);

/* Simple splines: */

const mySpline1 = L.spline(shape1.coords, {
  fill: true,
  color: "yellow",
  pane: "splines",
})
  .bindPopup(
    `<pre><code>
L.spline(coords, {
  fill: true,
  color: "yellow"
})
</code></pre>`,
    { minWidth: 200 }
  )
  .addTo(map);

const mySpline2 = L.spline(shape2.coords, {
  color: "yellow",
  pane: "splines",
})
  .bindPopup(`<pre><code>L.spline(coords, { color: "yellow" })</code></pre>`, {
    minWidth: 300,
  })
  .addTo(map);

// @ts-expect-error
window.mySpline1 = mySpline1;
// @ts-expect-error
window.mySpline2 = mySpline2;

/* GeoJSON splines */
const geojson = L.geoJSON(sample, {
  style: (feature) => ({ color: "rgba(0,0,0,0.5)" }),
}).addTo(map);

const geojsonWithSpline = L.geoJSON(sample, {
  // style: (feature) => ({ color: "yellow" }),
  spline: true,
}).addTo(map);

// @ts-expect-error
window.geojsonWithSpline = geojsonWithSpline;

L.control
  .layers(
    undefined,
    { "Original Polygons": originalShapes },
    { collapsed: false }
  )
  .addTo(map);
