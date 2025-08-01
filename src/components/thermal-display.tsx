"use client";

import { useMemo } from 'react';
import { cn, mapRange } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface ThermalDisplayProps {
  temperatureData: number[];
  minTemp: number;
  maxTemp: number;
  isBlurEnabled: boolean;
  isConnected: boolean;
}

const PIXEL_COUNT = 768;

// Hue range for temperature visualization (blue -> red)
const HUE_MIN = 180;
const HUE_MAX = 360;

const ThermalPixel = ({ temperature, minTemp, maxTemp }: { temperature: number; minTemp: number; maxTemp: number; }) => {
  const hue = useMemo(() => {
    const rawHue = mapRange(temperature, minTemp, maxTemp, HUE_MIN, HUE_MAX);
    // Constrain to ensure color is within the desired range as per original sketch
    return Math.max(160, Math.min(rawHue, 360));
  }, [temperature, minTemp, maxTemp]);
  
  const color = `hsl(${hue}, 100%, 50%)`;

  return <div className="aspect-square" style={{ backgroundColor: color }} />;
};


export const ThermalDisplay = ({ temperatureData, minTemp, maxTemp, isBlurEnabled, isConnected }: ThermalDisplayProps) => {
  
  const pixels = useMemo(() => {
    if (!isConnected || temperatureData.length !== PIXEL_COUNT) {
      return Array.from({ length: PIXEL_COUNT }).map((_, i) => (
         <Skeleton key={i} className="aspect-square bg-muted/20" />
      ));
    }
    return temperatureData.map((temp, index) => (
      <ThermalPixel key={index} temperature={temp} minTemp={minTemp} maxTemp={maxTemp} />
    ));
  }, [temperatureData, minTemp, maxTemp, isConnected]);

  return (
    <div className="relative w-full aspect-[4/3] bg-background rounded-lg overflow-hidden shadow-inner">
      <div className={cn('w-full h-full transition-all duration-500', isBlurEnabled && 'blur-md scale-105')}>
        <div className={`grid grid-cols-32 w-full h-full`}>
          {pixels}
        </div>
      </div>
      {!isConnected && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <p className="text-foreground/80 text-lg">Waiting for connection...</p>
         </div>
      )}
    </div>
  );
};
