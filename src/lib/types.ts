export type Unit = {
  code: string;
  name: string;
  location: string;
  state: string;
  stateCode: string;
  lga: string;
  lgaCode: string;
  ward: string;
  wardCode: string;
  portalId: string;
  coordinates: { lat: number; lng: number; source: string } | null;
  distance?: number;
};
export type Option = { code: string; name: string };
export type Result = {
  units: Unit[];
  total: number;
  page: number;
  pages: number;
  states: Option[];
  lgas: Option[];
  wards: Option[];
  coordinateCount: number;
  totalUnits: number;
};
