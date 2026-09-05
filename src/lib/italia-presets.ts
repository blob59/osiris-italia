export const ITALIA_PRESETS = {
  italia: { label: 'Italia', lat: 42.5, lng: 12.5, zoom: 5.6 },
  mediterraneo: { label: 'Mediterraneo', lat: 36.5, lng: 16, zoom: 4.2 },
  europa: { label: 'Europa', lat: 48, lng: 10, zoom: 4 },
} as const;

export type ItaliaPresetKey = keyof typeof ITALIA_PRESETS;
