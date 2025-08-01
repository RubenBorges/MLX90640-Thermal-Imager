
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

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
    requestPort(): Promise<SerialPort>;
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
      onError(new Error('Web Serial API not supported by this browser. Try using Chrome or Edge.'));
      return;
    }

    try {
      const port = await navigatorWithSerial.serial.requestPort();
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
        if (err.name !== 'NotFoundError') {
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
            readerRef.current.releaseLock();
            readerRef.current = null;
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
    
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader as any; // The types are slightly different, this is a safe cast
    let buffer = '';

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        
        buffer += value;

        let newlineIndex;
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
        reader.releaseLock();
        readerRef.current = null;
    }

  }, [onData, onError, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connect, disconnect };
};
