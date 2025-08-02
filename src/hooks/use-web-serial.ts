
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
    requestPort(options?: { filters: { usbVendorId: number }[] }): Promise<SerialPort>;
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
  
  const connect = useCallback(async () => {
    // Type assertion for navigator
    const navigatorWithSerial = window.navigator as Navigator;

    if (!navigatorWithSerial.serial) {
      onError(new Error('Web Serial API not supported by this browser.'));
      return;
    }

    try {
      // Provide filters to help identify the correct device, especially on Android.
      const port = await navigatorWithSerial.serial.requestPort({
        filters: [
            // Common Vendor IDs for Arduino, ESP32, and other microcontrollers
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
      
      port.addEventListener('disconnect', () => {
        disconnect();
        onError(new Error('Device disconnected.'));
      });
      
      startReading();
    } catch (err: any) {
        if (err.name === 'NotFoundError') {
             // This error occurs if the user cancels the port selection dialog.
             // We can choose to silently ignore it or show a gentle notification.
             // For now, we'll just log it and not bother the user.
             console.log("User cancelled port selection or no matching device found.");
        } else if (err.name === 'SecurityError') {
             onError(new Error('Permission to access serial port was denied. Please ensure the site is loaded over HTTPS.'));
        } else {
             onError(new Error(`Failed to connect: ${err.message}`));
        }
    }
  }, [onError]);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
        try {
            await readerRef.current.cancel();
        } catch(error) {
            // Ignore cancel error
        } finally {
            if (readerRef.current) {
                readerRef.current.releaseLock();
                readerRef.current = null;
            }
        }
    }
    
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err: any) {
        // Ignore errors on close
      } finally {
        portRef.current = null;
        setIsConnected(false);
      }
    }
  }, []);

  const startReading = useCallback(async () => {
    if (!portRef.current?.readable) return;
    
    // Use a TextDecoderStream to handle UTF-8 conversion.
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader as any; // The types are slightly different, this is a safe cast
    let buffer = '';

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          // Allow the serial port to be closed later.
          reader.releaseLock();
          break;
        }
        
        buffer += value;

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
      if(keepReadingRef.current) { // Don't show error if we intentionally disconnected
        onError(new Error(`Error reading from serial port: ${error.message}`));
        disconnect();
      }
    } finally {
        if (readerRef.current) {
            readerRef.current.releaseLock();
            readerRef.current = null;
        }
    }

  }, [onData, onError, disconnect]);

  useEffect(() => {
    return () => {
      // Ensure disconnection on component unmount
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connect, disconnect };
};
