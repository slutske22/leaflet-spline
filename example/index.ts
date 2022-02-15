import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "@elfalem/leaflet-curve"; // need this why???
import "./styles.css";
import { shape1, shape2, shape3, TILE_LAYER_URL } from "./constants";

import "../build";

export const map = L.map("map", {
  center: [2, -6.6],
  zoom: 8,
});

map.createPane("splines");
(map.getPane("splines") as HTMLElement).style.zIndex = "650";

L.tileLayer(TILE_LAYER_URL).addTo(map);

const s1 = shape1.asPolyline();
const s2 = shape2.asPolyline();
const s3 = shape3.asPolyline();

const originalShapes = L.layerGroup([s1, s2, s3]).addTo(map);

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

const mySpline3 = L.spline(shape3.coords, {
  color: "yellow",
  pane: "splines",
})
  .bindPopup(
    `<pre><code>
  L.spline(coords, { 
    color: "yellow",
    smoothing: <span id="smoothing-example">0.15</span>
  })
  </code></pre>
  <h4>Adjust the smoothing:</h4>
  <input id="smoothing-input" type="number" value="0.15" min="0" max="1" step="0.01" onchange="applySmoothing()">`,
    {
      minWidth: 300,
    }
  )
  .addTo(map);

function applySmoothing() {
  const value = document.getElementById("smoothing-input").value;
  document.getElementById("smoothing-example")?.innerHTML = value;
  mySpline3._smoothing = value;
  mySpline3.drawBezier();
}

// @ts-expect-error
window.applySmoothing = applySmoothing;

L.control
  .layers(
    undefined,
    { "Original Polygons": originalShapes },
    { collapsed: false }
  )
  .addTo(map);
