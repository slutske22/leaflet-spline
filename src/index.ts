import * as L from "leaflet";
import GeoUtil from "leaflet-geometryutil";
import "@elfalem/leaflet-curve";
import { CurvePathData } from "@elfalem/leaflet-curve";

type Tuple = [number, number];

/**
 * Get line length and bearing
 */
const line = (coord1: L.Point, coord2: L.Point) => {
  const lengthX = coord2.x - coord1.x;
  const lengthY = coord2.y - coord1.y;

  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX),
  };
};

/**
 * Gets 2 cubic bezier control points given a current, previous, and next point
 */
const controlPoint = (
  smoothing: number,
  map: L.Map,
  current: Tuple,
  previous?: Tuple,
  next?: Tuple,
  reverse?: boolean
): Tuple => {
  /**
   * When current is the first or last point of the array, prev and next
   * dont exist.  Replace with current
   */
  const p = previous || current;
  const n = next || current;

  const currPoint = map.latLngToLayerPoint(L.latLng(current));
  const prevPoint = map.latLngToLayerPoint(L.latLng(p));
  const nextPoint = map.latLngToLayerPoint(L.latLng(n));

  let { length, angle } = line(prevPoint, nextPoint);

  angle = angle + (reverse ? Math.PI : 0);
  length = length * smoothing;

  const x = currPoint.x + Math.cos(angle) * length;
  const y = currPoint.y + Math.sin(angle) * length;

  const { lat, lng } = map.layerPointToLatLng([x, y]);
  return [lat, lng];
};

interface SplineOptions extends L.PathOptions {
  /**
   * Smoothing factor to use when drawing the bezier curve, defaults to 0.15
   */
  smoothing?: number;
}

export class Spline extends L.Polyline {
  _points: Tuple[] = [];
  _curve: L.Curve;
  _smoothing: number;

  constructor(path: L.LatLngExpression[], options: SplineOptions) {
    super(path, options);
    this._smoothing = options.smoothing ?? 0.15;
    this.transformPoints(path);
  }

  /**
   * Transforms points into proper format for leaflet.curve (must be in [lat, lng] format)
   */
  transformPoints(path: L.LatLngExpression[]) {
    if (Array.isArray(path[0]) && path[0].length === 2) {
      // If path given is array of array of numbers, it is already in proper format
      this._points = path as Tuple[];
    } else if ((path[0] as L.LatLng | L.LatLngLiteral).lat) {
      // If path is given as latlngs, transform into Tuple / [number, number] format for
      this._points = (path as (L.LatLng | L.LatLngLiteral)[]).map((latlng) => [
        latlng.lat,
        latlng.lng,
      ]);
    }
  }

  drawBezier(): L.Curve {
    let points: Tuple[] = [...this._points];
    const first: Tuple = [...points[0]];

    /** points.length */
    const pl = points.length;

    /** Whether or not the path given is a closed shape - last point must be same as first */
    const isClosedShape =
      points[0][0] === points[pl - 1][0] && points[0][1] === points[pl - 1][1];

    const controlPoints = [];
    for (let i = 0; i < pl - 1; i++) {
      controlPoints.push(
        controlPoint(
          this._smoothing,
          this._map,
          points[i],
          points[i + 1],
          points[i - 1]
        )
      );
      controlPoints.push(
        controlPoint(
          this._smoothing,
          this._map,
          points[i],
          points[i - 1],
          points[i + 1]
        )
      );
    }

    if (!isClosedShape) {
      /* Remove first (and last) control points for open shapes */
      controlPoints.shift();
      /* Push one last control point just before the last reference point, has no 'next' */
      controlPoints.push(
        controlPoint(
          this._smoothing,
          this._map,
          points[pl - 1],
          undefined,
          points[pl - 2]
        )
      );
    } else {
      /* Shift points */
      const firstCp = controlPoints.shift();
      controlPoints.push(firstCp);

      /* Recalculate first cp with last point in points as previous */
      controlPoints[0] = controlPoint(
        this._smoothing,
        this._map,
        points[pl - 1],
        points[pl - 2],
        points[1]
      );

      controlPoints[controlPoints.length - 1] = controlPoint(
        this._smoothing,
        this._map,
        points[pl - 1],
        points[1],
        points[pl - 2]
      );
    }

    /** Series of SVG commands mixed with coordinates to be used with L.curve */
    const commands: CurvePathData = ["M", first]; // Begin with placing pen at first point

    points = [...this._points];

    const lineTo = points.shift();
    commands.push(...(["L", lineTo] as CurvePathData)); // draw line to first point (its a dot), helpful for dev

    while (points.length > 0) {
      const cp1 = controlPoints.shift();
      const cp2 = controlPoints.shift();

      const destination = points.shift();
      commands.push(...(["C", cp1, cp2, destination] as CurvePathData));
    }

    if (isClosedShape) {
      commands.push("Z"); // Complete the drawing
    }

    this._curve = L.curve(commands, { ...this.options, interactive: false });
    return this._curve;
  }

  onAdd(map: L.Map) {
    this.drawBezier();
    this._curve.addTo(map);
    return this;
  }

  addTo(map: L.Map | L.LayerGroup<any>): this {
    map.addLayer(this);
    return this;
  }
}

export function spline(
  path: L.LatLngExpression[],
  options: SplineOptions = {}
) {
  return new Spline(path, options);
}

declare module "leaflet" {
  export class Spline {}
  export function spline(
    path: L.LatLngExpression[],
    options?: SplineOptions
  ): Spline;
}
