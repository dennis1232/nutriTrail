/** Pure unit-conversion helpers. Internal storage is always metric
 * (kg, cm); imperial is only a display/input concern. */

export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}
