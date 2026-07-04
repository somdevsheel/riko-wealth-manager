// Categorical palette, validated with the dataviz skill's validate_palette.js
// (light mode, worst adjacent CVD ΔE 11.2 — floor band, mitigated by the direct
// labels/legend text used everywhere this palette appears). Fixed hue-per-category
// so identity never repaints as month-to-month ranking shifts.
export const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#008300',
  Groceries: '#eb6834',
  Dining: '#2a78d6',
  Transport: '#1baf7a',
  Utilities: '#4a3aa7',
  Shopping: '#e34948',
  Entertainment: '#e87ba4',
  Health: '#eda100',
  Investment: '#5a5750',
};

export const OTHER_COLOR = '#a6a49c';

export function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? OTHER_COLOR;
}
