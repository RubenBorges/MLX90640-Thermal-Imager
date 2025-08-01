"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Power, Thermometer, ThermometerSun, SlidersHorizontal } from "lucide-react";

interface ControlPanelProps {
  isConnected: boolean;
  isBlurEnabled: boolean;
  onConnectionToggle: () => void;
  onBlurToggle: (enabled: boolean) => void;
  minTemp: number;
  maxTemp: number;
}

export const ControlPanel = ({
  isConnected,
  isBlurEnabled,
  onConnectionToggle,
  onBlurToggle,
  minTemp,
  maxTemp
}: ControlPanelProps) => {
  return (
    <div className="w-full p-4 bg-card rounded-lg border flex flex-col lg:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <Button onClick={onConnectionToggle} className="w-44">
          <Power className="mr-2 h-4 w-4" />
          {isConnected ? 'Disconnect' : 'Connect to Device'}
        </Button>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? 'Live' : 'Offline'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-accent" />
            <div className="text-left">
                <p className="text-xs text-muted-foreground">MIN TEMP</p>
                <p className="text-xl font-bold text-accent font-mono">{isConnected ? `${minTemp.toFixed(1)}°C` : '--.-°C'}</p>
            </div>
        </div>
         <div className="flex items-center gap-2">
            <ThermometerSun className="h-6 w-6 text-primary" />
            <div className="text-left">
                <p className="text-xs text-muted-foreground">MAX TEMP</p>
                <p className="text-xl font-bold text-primary font-mono">{isConnected ? `${maxTemp.toFixed(1)}°C` : '--.-°C'}</p>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        <Label htmlFor="blur-mode" className="text-sm font-medium text-foreground/90">Smooth Pixels</Label>
        <Switch id="blur-mode" checked={isBlurEnabled} onCheckedChange={onBlurToggle} />
      </div>
    </div>
  );
};
