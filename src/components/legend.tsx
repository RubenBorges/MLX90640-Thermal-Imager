"use client";

import { useMemo } from 'react';
import { mapRange } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface LegendProps {
  minTemp: number;
  maxTemp: number;
  isConnected: boolean;
}

const HUE_MIN = 180;
const HUE_MAX = 360;
const NUM_INTERVALS = 6;

export const Legend = ({ minTemp, maxTemp, isConnected }: LegendProps) => {
  const legendItems = useMemo(() => {
    if (!isConnected || minTemp >= maxTemp) {
      return Array.from({ length: NUM_INTERVALS }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-12 h-6 rounded" />
        </div>
      ));
    }

    const tempDifference = maxTemp - minTemp;
    const interval = tempDifference > 0 ? tempDifference / (NUM_INTERVALS - 1) : 0;
    
    return Array.from({ length: NUM_INTERVALS }).map((_, i) => {
      const temp = minTemp + (i * interval);
      const rawHue = mapRange(temp, minTemp, maxTemp, HUE_MIN, HUE_MAX);
      const hue = Math.max(160, Math.min(rawHue, 360));
      const color = `hsl(${hue}, 100%, 50%)`;

      return (
        <div key={i} className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-full h-4 rounded-sm" style={{ backgroundColor: color }} />
          <p className="text-sm text-foreground/80 font-mono">{temp.toFixed(1)}°C</p>
        </div>
      );
    });
  }, [minTemp, maxTemp, isConnected]);

  return (
    <div className="w-full mt-4 p-4 bg-card rounded-lg border">
      <div className="grid grid-cols-6 gap-4">
        {legendItems}
      </div>
    </div>
  );
};
