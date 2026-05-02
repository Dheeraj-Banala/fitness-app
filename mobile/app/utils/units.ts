export const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number) => lbs / 2.20462;

export const mlToOz = (ml: number) => Math.round(ml / 29.5735 * 10) / 10;
export const ozToMl = (oz: number) => oz * 29.5735;

export const cmToFtIn = (cm: number) => ({
  feet: Math.floor(cm / 30.48),
  inches: Math.round(((cm / 30.48) % 1) * 12),
});
export const ftInToCm = (feet: number, inches: number) => feet * 30.48 + inches * 2.54;
