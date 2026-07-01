export interface RegionContext {
  region: string;
  signals: Record<string, number>;
}

export interface RegionEnricher {
  enrich(region: string): Promise<RegionContext>;
}

export const noopEnricher: RegionEnricher = {
  async enrich(region) {
    return { region, signals: {} };
  },
};

export function getEnricher(): RegionEnricher {
  return noopEnricher;
}
