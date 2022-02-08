import * as L from "leaflet";
import "leaflet-curve";

type Tuple = [number, number];

export class Spline extends L.Polyline {
  _points: Tuple[] = [];

  constructor(path: L.LatLngExpression[], options: L.PathOptions = {}) {
    super(path, options);
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

  drawBezier() {
    const points: Tuple[] = [...this._points];
    const first: Tuple = [...points[0]];
    const second: Tuple = [...points[1]];

    /** Whether or not the path given is a closed shape - last point must be same as first */
    const isClosedShape =
      points[0][0] === points[points.length - 1][0] &&
      points[0][1] === points[points.length - 1][1];

    if (isClosedShape) {
      points.pop();
    }

    /**
     * Group points into threes - 1rst and 3rd used to create control point, second corresponds to control
     * point to be used that gets created by 1rst and 3rd
     */
    const triads: [Tuple, Tuple, Tuple][] = [];
    while (points.length > 2) {
      const triad: [Tuple, Tuple, Tuple] = [points[0], points[1], points[2]];
      triads.push(triad);
      points.shift();
    }
    if (isClosedShape) {
      triads.push([points[0], points[1], first]);
      points.unshift();
      triads.push([points[0], first, second]);
    }

    /** Control points to be used in creating the bezier curve */
    const controlPoints = triads
      .map((triad) => triad.map((tuple) => L.latLng(tuple)))
      .map((triad) => {
        const [p0, p1, p2] = triad;
        const cpLat = p1.lat * 2 - (p0.lat + p2.lat) / 2;
        const cpLng = p1.lng * 2 - (p0.lng + p2.lng) / 2;
        return L.latLng({ lat: cpLat, lng: cpLng });
      });

    controlPoints.forEach((point) => L.circleMarker(point).addTo(this._map));
  }

  addTo(map: L.Map | L.LayerGroup<any>): this {
    map.addLayer(this);
    return this;
  }
}

export function spline(
  path: L.LatLngExpression[],
  options: L.PathOptions = {}
) {
  return new Spline(path, options);
}

declare module "leaflet" {
  export class Spline {}
  export function spline(
    path: L.LatLngExpression[],
    options?: L.PathOptions
  ): undefined;
}
