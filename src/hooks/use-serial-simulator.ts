"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

const WIDTH = 32;
const HEIGHT = 24;
const PIXEL_COUNT = WIDTH * HEIGHT; // 768

export const useSerialSimulator = (
  onData: (data: string) => void,
  frameRate: number = 15
) => {
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const angleRef = useRef(0);

  const generateThermalData = useCallback(() => {
    const data = new Array(PIXEL_COUNT).fill(0);
    const baseTemp = 25; // Celsius
    const noiseAmplitude = 5;
    const hotspotAmplitude = 15;

    // Calculate hotspot center coordinates
    const hotspotX = (WIDTH / 2) + (Math.cos(angleRef.current) * (WIDTH / 3));
    const hotspotY = (HEIGHT / 2) + (Math.sin(angleRef.current) * (HEIGHT / 3));
    angleRef.current += 0.05; // Move hotspot for the next frame

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const index = y * WIDTH + x;
        
        // Basic noise
        let temp = baseTemp + (Math.random() - 0.5) * noiseAmplitude;
        
        // Add hotspot
        const distance = Math.sqrt(Math.pow(x - hotspotX, 2) + Math.pow(y - hotspotY, 2));
        const hotspotEffect = hotspotAmplitude * Math.exp(-0.1 * Math.pow(distance, 2));
        temp += hotspotEffect;
        
        data[index] = parseFloat(temp.toFixed(2));
      }
    }

    return data;
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsConnected(true);
    intervalRef.current = setInterval(() => {
      const data = generateThermalData();
      const csvString = data.join(',') + '\r';
      onData(csvString);
    }, 1000 / frameRate);
  }, [onData, frameRate, generateThermalData]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if(intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, []);

  return { isConnected, start, stop };
};
