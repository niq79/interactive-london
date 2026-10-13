export type Theme = 'dark' | 'light' | 'imperial' | 'rebel';

type ThemeSettings = {
  label: string;
  themeColor: string;
  route: string;
  routeHalo: string;
};

export const themeOrder: Theme[] = ['dark', 'light', 'imperial', 'rebel'];

export const themes: Record<Theme, ThemeSettings> = {
  dark: { label: 'London Dark', themeColor: '#171e1b', route: '#ffc36a', routeHalo: '#111914' },
  light: { label: 'London Light', themeColor: '#faf8f2', route: '#a95712', routeHalo: '#ffffff' },
  imperial: { label: 'Imperial', themeColor: '#2d2a26', route: '#ff4d00', routeHalo: '#2d2a26' },
  rebel: { label: 'Rebel', themeColor: '#f4ead5', route: '#c85027', routeHalo: '#fff7e8' },
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && themeOrder.includes(value as Theme);
}
