/**
 * API Response Types
 */

export interface Factory {
  fac_id: number;
  fac_name: string;
}

export interface Area {
  area_id: number;
  area_name: string;
  fac_id: number;
}

export interface Dryer {
  dry_id: number;
  dry_name: string;
  status: string;
  area_id: number;
}

export interface Fruit {
  fruit_id: number;
  fruit_name: string;
}

