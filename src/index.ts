import * as L from "leaflet";
import "@elfalem/leaflet-curve";
import { CurvePathData } from "@elfalem/leaflet-curve";

type Tuple = [number, number];

export class Spline extends L.Polyline {
  _points: Tuple[] = [];
  _curve: L.Curve;
  // debug:
  _controlPoints: L.LayerGroup;
  _refPoints: L.LayerGroup;

  constructor(path: L.LatLngExpression[], options: L.PathOptions = {}) {
    super(path, options);
    this.transformPoints(path);
    this.drawBezier();
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
      points.shift();
    }
    if (isClosedShape) {
      triads.push([points[0], points[1], first]);
      points.shift();
      triads.push([points[0], first, second]);
    }

    /** Control points to be used in creating the bezier curve */
    const controlPoints = triads
      // .filter((_t, i) => i % 2)
      .map((triad) => triad.map((tuple) => L.latLng(tuple)))
      .map((triad) => {
        const [p0, p1, p2] = triad;
        const cpLat = p1.lat * 2 - (p0.lat + p2.lat) / 2;
        const cpLng = p1.lng * 2 - (p0.lng + p2.lng) / 2;
        return [cpLat, cpLng];
      });

    controlPoints.pop();

    this._controlPoints = L.layerGroup(
      controlPoints.map(([lat, lng], i) =>
        L.circleMarker({ lat, lng }).bindPopup(`<h5>cp${i}</h5>`)
      )
    );

    /** Series of SVG commands mixed with coordinates to be used with L.curve */
    const commands: CurvePathData = ["M", first]; // Begin with placing pen at first point

    points = [...this._points];

    this._refPoints = L.layerGroup(
      points
        .map(([lat, lng], i) =>
          L.circleMarker({ lat, lng }, { color: "grey" }).bindPopup(
            `<h5>point ${i}</h5><pre>${JSON.stringify(
              { lat, lng },
              null,
              2
            )}</pre>`
          )
        )
        .filter((_p, i) => i !== 12)
    );

    // points.shift();

    const lineTo = points.shift() as number[];
    commands.push(...(["L", lineTo] as CurvePathData)); // draw line to next anchor point

    while (points.length - 1 > 0) {
      const cp = controlPoints.shift() as number[];
      points.shift();
      const desintation = points.shift() as number[];
      commands.push(...(["Q", cp, desintation] as CurvePathData));
    }

    commands.push("Z"); // Complete the drawing

    console.log(commands);

    this._curve = L.curve(commands, { ...this.options, interactive: false });
    return this._curve;
  }

  addTo(map: L.Map | L.LayerGroup<any>): this {
    // debug:
    this._refPoints.addTo(map);
    this._controlPoints.addTo(map);

    map.addLayer(this._curve);
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
