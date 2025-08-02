
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import "web-serial-polyfill";

// Define the structure for the serial port object
interface SerialPort extends EventTarget {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  addEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | EventListenerOptions): void;
}

// Define the structure for the navigator object
interface Navigator {
  serial: {
    requestPort(options?: { filters: ({ usbVendorId: number, usbProductId?: number })[] }): Promise<SerialPort>;
  };
}

export const useWebSerial = (
  onData: (data: string) => void,
  onError: (error: Error) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(true);
  
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
        try {
            // This will interrupt the reader's read() promise
            await readerRef.current.cancel();
        } catch(error) {
            // Ignore cancel error, it's expected
        }
    }
    
    if (portRef.current) {
      try {
        // This will release any resources held by the port
        await portRef.current.close();
      } catch (err: any) {
        // Ignore errors on close, the port might already be gone
      }
    }

    portRef.current = null;
    readerRef.current = null;
    setIsConnected(false);

  }, []);


  const connect = useCallback(async () => {
    // Type assertion for navigator
    const navigatorWithSerial = window.navigator as Navigator;

    if (!navigatorWithSerial.serial) {
      onError(new Error('Web Serial API not supported by this browser.'));
      return;
    }

    try {
      // Provide filters to help identify the correct device.
      const port = await navigatorWithSerial.serial.requestPort({
        filters: [
            // User's specific ESP32-S3
            { usbVendorId: 0x1A86, usbProductId: 0x55D3 },
            // Common Vendor IDs for other microcontrollers
            { usbVendorId: 0x2341 }, // Arduino LLC
            { usbVendorId: 0x1A86 }, // WCH.CN (CH340)
            { usbVendorId: 0x10C4 }, // Silicon Labs (CP210x)
            { usbVendorId: 0x0403 }, // FTDI
        ],
      });
      await port.open({ baudRate: 115200 }); // Standard baud rate for Arduino/ESP32
      portRef.current = port;
      setIsConnected(true);
      keepReadingRef.current = true;
      
      // The disconnect event can be unreliable with polyfills.
      // A more robust way is to handle errors during the read loop.
      port.addEventListener('disconnect', () => {
        // Don't call disconnect() here directly to avoid potential race conditions.
        // The read loop will fail and handle the disconnection gracefully.
        onError(new Error('Device disconnected.'));
        setIsConnected(false);
        portRef.current = null;
      });
      
      startReading();
    } catch (err: any) {
        if (err.name === 'NotFoundError') {
             console.log("User cancelled port selection or no matching device found.");
        } else if (err.name === 'SecurityError') {
             onError(new Error('Permission to access serial port was denied. Please ensure the site is loaded over HTTPS.'));
        } else {
             onError(new Error(`Failed to connect: ${err.message}`));
        }
    }
  }, [onError, disconnect]);

  const startReading = useCallback(async () => {
    if (!portRef.current?.readable) return;
    
    readerRef.current = portRef.current.readable.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (keepReadingRef.current && portRef.current) {
        const { value, done } = await readerRef.current.read();
        if (done) {
          // The reader has been cancelled, which is part of the disconnect process.
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        // Process all complete lines in the buffer
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            onData(line);
          }
        }
      }
    } catch (error: any) {
      if(keepReadingRef.current) { 
        onError(new Error(`Error reading from serial port: ${error.message}`));
        disconnect();
      }
    } finally {
        if(readerRef.current){
           readerRef.current.releaseLock();
           readerRef.current = null;
        }
    }

  }, [onData, onError, disconnect]);

  useEffect(() => {
    // This is a cleanup effect. If the component using this hook unmounts,
    // we must ensure we disconnect to prevent memory leaks.
    return () => {
      if(isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return { isConnected, connect, disconnect };
};
