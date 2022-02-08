import * as L from "leaflet";
import "leaflet-curve";

export class Spline extends L.Polyline {
  _polyline: L.Polyline;
  _points: [number, number][] = [];

  constructor(path: L.LatLngExpression[], options: L.PathOptions = {}) {
    super(path, options);
    this._polyline = L.polyline(path, options);
    this.transformPoints(path);
  }

  /**
   * Transforms points into proper format for leaflet.curve (must be in [lat, lng] format)
   */
  transformPoints(path: L.LatLngExpression[]) {
    if (Array.isArray(path[0]) && path[0].length === 2) {
      // If path given is array of array of numbers, it is already in proper format
      this._points = path as [number, number][];
    } else if ((path[0] as L.LatLng | L.LatLngLiteral).lat) {
      // If path is given as latlngs, transform into [number, number] format for
      this._points = (path as (L.LatLng | L.LatLngLiteral)[]).map((latlng) => [
        latlng.lat,
        latlng.lng,
      ]);
    }
  }

  drawBezier() {}

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
