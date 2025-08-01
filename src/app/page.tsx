"use client";

import { useState, useCallback, useEffect } from "react";
import { useSerialSimulator } from "@/hooks/use-serial-simulator";
import { ThermalDisplay } from "@/components/thermal-display";
import { Legend } from "@/components/legend";
import { ControlPanel } from "@/components/control-panel";
import { Thermometer } from "lucide-react";

const PIXEL_COUNT = 768;

export default function ThermalVisionPage() {
  const [temperatureData, setTemperatureData] = useState<number[]>([]);
  const [minTemp, setMinTemp] = useState(0);
  const [maxTemp, setMaxTemp] = useState(0);
  const [isBlurEnabled, setIsBlurEnabled] = useState(true);

  const handleData = useCallback((csvString: string) => {
    if (!csvString || csvString.length === 0) return;

    // The original sketch limits the string length, let's do the same as a safeguard
    const safeString = csvString.length > 4608 ? csvString.substring(0, 4608) : csvString;
    const stringValues = safeString.split(',');

    if (stringValues.length < PIXEL_COUNT) return;

    let localMin = 500;
    let localMax = 0;
    const newTemps: number[] = [];

    for (let i = 0; i < PIXEL_COUNT; i++) {
      const temp = parseFloat(stringValues[i]);
      if (!isNaN(temp)) {
        newTemps.push(temp);
        if (temp > localMax) localMax = temp;
        if (temp < localMin) localMin = temp;
      } else {
        newTemps.push(0); // Default value for invalid data
      }
    }
    
    setTemperatureData(newTemps);
    setMinTemp(localMin);
    setMaxTemp(localMax);
  }, []);

  const { isConnected, start, stop } = useSerialSimulator(handleData);

  const handleConnectionToggle = () => {
    if (isConnected) {
      stop();
      setTemperatureData([]);
      setMinTemp(0);
      setMaxTemp(0);
    } else {
      start();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full mb-4">
              <Thermometer className="h-5 w-5" />
              <span className="font-semibold">Live Thermal Imaging</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Thermal Vision
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualizing data from a simulated MLX90640 sensor. Connect to the device to see a real-time thermal heatmap.
          </p>
        </div>

        <ControlPanel
          isConnected={isConnected}
          isBlurEnabled={isBlurEnabled}
          onConnectionToggle={handleConnectionToggle}
          onBlurToggle={setIsBlurEnabled}
          minTemp={minTemp}
          maxTemp={maxTemp}
        />
        
        <ThermalDisplay
          temperatureData={temperatureData}
          minTemp={minTemp}
          maxTemp={maxTemp}
          isBlurEnabled={isBlurEnabled}
          isConnected={isConnected}
        />

        <Legend 
            minTemp={minTemp}
            maxTemp={maxTemp}
            isConnected={isConnected}
        />
        
        <footer className="text-center text-sm text-muted-foreground mt-8">
            <p>Replication of a Processing 4 application in Next.js.</p>
            <p>Original concept by Nick Poole, SparkFun Electronics.</p>
        </footer>
      </div>
    </main>
  );
}
