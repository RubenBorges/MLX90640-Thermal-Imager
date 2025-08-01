import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  // Avoid division by zero
  if (inMin === inMax) {
    return (outMin + outMax) / 2;
  }
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
