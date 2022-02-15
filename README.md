<p align="center">
  <img src="./spline.png" width="400px">
</p>

Leaflet-spline is a small plugin for leafletjs that transforms polylines and polygons into bezier splines

<h1 align="center">👀 DEMO 👀</h1>

## Install

`npm install leaflet-spline`

## Use

You can import leaflet-spline, and `L.spline` becomes available:

```js
import L from 'leaflet';
import 'leaflet-spline';

const map = L.map('mapdiv', <MapOptions>);

const latLngs = [
  [-5.9765, 2.9542],
  [-6.1523, 2.5918],
  [-5.8337, 2.4052],
  [-5.5743, 2.4821],
  [-5.2294, 2.4492],
  [-4.9545, 2.1308],
  [-4.3286, 2.0544],
];

const mySpline = L.spline(latLngs);
mySpline.addTo(map);
```

You can also import `spline` directly:

```js
import { spline } from "leaflet-spline";

const mySpline = spline(latLngs);
```

Note if you are using synthetic default imports with TypeScript, you _must_ import `spline` in this fashion:

```js
import * as L from "leaflet";
import { spline } from "leaflet-spline";

const mySpline = spline(latLngs);
```

## Options

`L.spline` takes an array of `L.LatLng` objects, or an array of `LatLng` tuples (`[number, number]`) as its primary argument.

`L.spline` inherits all options from `L.PathOptions`. It also offers the `smoothing` option, which determines where to place the control points used to shape the bezier curves. All options are not required. The `smoothing` defaults to 0.15, but can be adjusted down for sharper corners. Too high a `smoothing` value will yield some strange shapes.

```js
const mySpline = L.spline(latLngs, {
  color: "black",
  weight: 5,
  smoothing: 0.1,
});
```

## Closed shapes

leaflet-spline draws polylines by default (as opposed to polygons). If you want the appearance of a closed-polygon shape, you must ensure that your set of points has the exact same coordinate for the first and last entries:

```js
const latLngs = [
  [5.1, 2.9], // First entry \
  [6.1, 2.5], //              \
  [6.2, 2.7]  //                -> Must be identical
  [5.8, 2.4], //              /
  [5.1, 2.9], // Last entry  /
];
```

With a circular point set, you can set the `fill` to true to create the appearance of a closed shape spline:

```js
const mySpline = L.spline(latLngs, { fill: true });
```

See the demo for examples.