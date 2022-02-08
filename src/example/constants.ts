import * as L from "leaflet";
import { CoordSet } from "./utils";

export const TILE_LAYER_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}";

export const shape1 = new CoordSet(
  [
    [-5.9765625, 2.9540126939036564],
    [-6.15234375, 2.591888984149953],
    [-5.833740234375, 2.4052990502867853],
    [-5.570068359375, 2.482133403730576],
    [-5.2294921875, 2.4492049339511506],
    [-4.954833984374999, 2.1308562777325313],
    [-4.32861328125, 2.054003264372146],
    [-3.8891601562499996, 2.28455066023697],
    [-4.04296875, 2.756504385543263],
    [-4.449462890625, 3.052753821574483],
    [-4.888916015625, 3.1843944923387464],
    [-5.548095703125, 3.1514858749293237],
    [-5.9765625, 2.9540126939036564]
  ].map((pair) => L.latLng(pair.reverse() as [number, number]))
);

export const shape2 = shape1.shift({ down: 1.5 });
