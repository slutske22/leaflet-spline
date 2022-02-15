import L from "leaflet";
import "@elfalem/leaflet-curve";
import { CurvePathData } from "@elfalem/leaflet-curve";
import { Feature, LineString, MultiLineString } from "geojson";

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
    this._curve = new L.Curve([], { ...options });
    this._smoothing = options.smoothing ?? 0.15;
    this._transformPoints(path);
  }

  /**
   * Transforms points into proper format for leaflet.curve (must be in [lat, lng] format)
   */
  _transformPoints(path: L.LatLngExpression[]) {
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

    if (!this._curve) {
      this._curve = L.curve(commands, { ...this.options });
    } else {
      this._curve.setPath(commands);
    }
    return this._curve;
  }

  /**
   * Redraw bezier on update
   */
  update() {
    this.drawBezier();
  }

  onAdd(map: L.Map) {
    this.drawBezier();
    this._curve.addTo(map);

    map.on("zoomend", () => {
      this.update();
    });

    return this;
  }

  onRemove(map: L.Map): this {
    map.off("zoomend", () => {
      this.update();
    });
    this._curve.remove();
    return this;
  }

  /* -------- Forward methods to this._curve -------- */

  /* Events from L.Evented */

  on(type: any, fn?: any, context?: any): this {
    this._curve.on(type, fn, context);
    return this;
  }
  off(type?: any, fn?: any, context?: any): this {
    this._curve.off(type, fn, context);
    return this;
  }
  once(type: any, fn?: any, context?: any): this {
    this._curve.once(type, fn, context);
    return this;
  }
  fire(type: string, data?: any, propagate?: boolean): this {
    this._curve.once(type, data, propagate);
    return this;
  }
  listens(type: string): boolean {
    return this._curve.listens(type);
  }
  addEventParent(obj: L.Evented): this {
    this._curve.addEventParent(obj);
    return this;
  }
  removeEventParent(obj: L.Evented): this {
    this._curve.removeEventParent(obj);
    return this;
  }
  addEventListener(type: any, fn?: any, context?: any): this {
    this._curve.addEventListener(type, fn, context);
    return this;
  }
  removeEventListener(type: any, fn?: any, context?: any): this {
    this._curve.removeEventListener(type, fn, context);
    return this;
  }
  clearAllEventListeners(): this {
    this._curve.clearAllEventListeners();
    return this;
  }
  fireEvent(type: string, data?: any, propagate?: boolean): this {
    this._curve.fireEvent(type, data, propagate);
    return this;
  }
  hasEventListeners(type: string): boolean {
    return this._curve.hasEventListeners(type);
  }

  /* Layer methods from L.Layer */
  remove(): this {
    this._curve.remove();
    return this;
  }
  removeFrom(map: L.Map): this {
    this._curve.removeFrom(map);
    return this;
  }
  getPane(name?: string): HTMLElement | undefined {
    return this._curve.getPane(name);
  }
  bindPopup(
    content: ((layer: L.Layer) => L.Content) | L.Content | L.Popup,
    options?: L.PopupOptions
  ): this {
    console.log(options);
    this._curve.bindPopup(content, options);
    return this;
  }
  unbindPopup(): this {
    this._curve.unbindPopup();
    return this;
  }
  openPopup(latlng?: L.LatLngExpression): this {
    this._curve.openPopup(latlng);
    return this;
  }
  closePopup(): this {
    this._curve.closePopup();
    return this;
  }
  togglePopup(): this {
    this._curve.togglePopup();
    return this;
  }
  isPopupOpen(): boolean {
    return this._curve.isPopupOpen();
  }
  setPopupContent(content: L.Content | L.Popup): this {
    this._curve.setPopupContent(content);
    return this;
  }
  getPopup(): L.Popup | undefined {
    return this._curve.getPopup();
  }
  bindTooltip(
    content: ((layer: L.Layer) => L.Content) | L.Tooltip | L.Content,
    options?: L.TooltipOptions
  ): this {
    this._curve.bindTooltip(content, options);
    return this;
  }
  unbindTooltip(): this {
    this._curve.unbindTooltip();
    return this;
  }
  openTooltip(latlng?: L.LatLngExpression): this {
    this._curve.openTooltip(latlng);
    return this;
  }
  closeTooltip(): this {
    this._curve.closeTooltip();
    return this;
  }
  toggleTooltip(): this {
    this._curve.toggleTooltip();
    return this;
  }
  isTooltipOpen(): boolean {
    return this._curve.isTooltipOpen();
  }
  setTooltipContent(content: L.Content | L.Tooltip): this {
    this._curve.setTooltipContent(content);
    return this;
  }
  getTooltip(): L.Tooltip | undefined {
    return this._curve.getTooltip();
  }

  /* Path methods from L.Path */
  redraw(): this {
    this._curve.redraw();
    return this;
  }
  setStyle(style: L.PathOptions): this {
    L.Util.setOptions(this, style);
    this._curve.setStyle(style);
    return this;
  }
  bringToFront(): this {
    this._curve.bringToFront();
    return this;
  }
  bringToBack(): this {
    this._curve.bringToBack();
    return this;
  }
  getElement(): Element | undefined {
    return this._curve.getElement();
  }

  /* Polyline methods from L.Polyline */
  setLatLngs(latlngs: L.LatLngExpression[]): this {
    this._transformPoints(latlngs);
    this.drawBezier();
    return this;
  }

  /* Curve methods from L.Curve */
  trace(samplingDistance: number[]): L.LatLng[] {
    return this._curve.trace(samplingDistance);
  }
}

export function spline(
  path: L.LatLngExpression[],
  options: SplineOptions = {}
) {
  return new Spline(path, options);
}

declare module "leaflet" {
  export class Spline extends L.Polyline {
    constructor(path: L.LatLngExpression[], options: SplineOptions);
    drawBezier(): void;
    _smoothing: number;
  }
  export function spline(
    path: L.LatLngExpression[],
    options?: SplineOptions
  ): Spline;
}

L.Spline = Spline;
L.spline = spline;

export {};
