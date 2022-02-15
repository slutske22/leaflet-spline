import * as L from "leaflet";

interface ShiftOptions {
  up?: number;
  down?: number;
  left?: number;
  right?: number;
}

interface Style extends L.PathOptions {
  drawVertices?: boolean;
}

const defaultStyle: Style = {
  drawVertices: true,
  fill: true,
  weight: 10,
  color: "rgba(0,0,0,0.2)",
};

/**
 * Utility for creating and manipulating arrays of L.LatLng coordinates
 */
export class CoordSet {
  coords: L.LatLng[];

  /**
   * Utility for creating and manipulating arrays of L.LatLng coordinates
   */
  constructor(coords: L.LatLng[]) {
    this.coords = coords;
  }

  /**
   * Shifts a set of coordinates up, down, left, or right
   */
  shift(options: ShiftOptions) {
    let { up, down, left, right } = options;
    const newCoords = this.coords.map((coord) => {
      let { lat, lng } = coord;

      if (up) {
        lat = lat + up;
      }
      if (down) {
        lat = lat - down;
      }
      if (left) {
        lng = lng - left;
      }
      if (right) {
        lng = lng + right;
      }

      return L.latLng({ lat, lng });
    });

    return new CoordSet(newCoords);
  }

  asPolyline(useroptions = defaultStyle) {
    const options = { ...defaultStyle, ...useroptions };

    const { drawVertices, fill, ...others } = options;

    if (drawVertices) {
      const group = L.layerGroup();

      L.polyline(this.coords, {
        ...options,
        interactive: false,
        fill: false,
      }).addTo(group);

      this.coords.forEach((coord, i) => {
        L.circleMarker(coord, {
          radius: 5,
          color: "rgba(0,0,0,0.5)",
          interactive: false,
        }).addTo(group);
      });

      return group;
    }

    return L.polyline(this.coords, { ...defaultStyle, ...others });
  }

  asPolygon(options = defaultStyle) {
    const { drawVertices, fill, ...others } = options;

    if (drawVertices) {
      const group = L.layerGroup();
      L.polygon(this.coords, { ...others, interactive: false }).addTo(group);
      this.coords.forEach((coord, i) => {
        L.circleMarker(coord, {
          radius: 5,
          color: "rgba(0,0,0,0.5)",
          interactive: false,
        }).addTo(group);
      });
      return group;
    }

    return L.polygon(this.coords, others);
  }
}
