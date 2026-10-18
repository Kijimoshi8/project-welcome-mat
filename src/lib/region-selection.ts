import { REGIONS } from "./data";

export function selectedRegions(value: string | undefined): string[] {
  return value === undefined
    ? ["plock", "gostynin", "sierpc"]
    : value.split(",").filter((id) => REGIONS.some((region) => region.id === id));
}

export function toggleRegion(regions: string[], id: string): string {
  return (regions.includes(id)
    ? regions.filter((region) => region !== id)
    : [...regions, id].slice(-5)
  ).join(",");
}