import type { Coordinate } from "@mission-studio/core";

export interface MapPoint {
  readonly id: string;
  readonly label: string;
  readonly sequence: number;
  readonly position: Coordinate;
}

export interface MapViewport {
  readonly center: Coordinate;
  readonly zoom: number;
}

export interface MapSelection {
  readonly position: Coordinate;
}

export interface MapAuthoringProps {
  readonly points: readonly MapPoint[];
  readonly initialViewport: MapViewport;
  readonly readOnly?: boolean;
  readonly onSelect?: (selection: MapSelection) => void;
}

export type { Coordinate } from "@mission-studio/core";
