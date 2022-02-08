import * as L from "leaflet";

declare module "leaflet" {
  class Spline extends L.Path {
    constructor(path: L.LatLngExpression[], options?: L.PathOptions);
  }

  function spline(path: L.LatLngExpression[], options?: L.PathOptions): Spline;
}

// @ts-ignore
L.Spline = L.Path.extend({
  initialize: function (
    path: L.LatLngExpression[],
    options: L.PathOptions = {}
  ) {
    L.setOptions(this, options);
    this._setPath(path);
  },

  _setPath: function (path: L.LatLngExpression[]) {
    this._coords = path;
  },
});

// @ts-ignore
L.spline = function (path: L.LatLngExpression[], options?: L.PathOptions) {
  return new L.Spline(path, options);
};
