"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

import { Button } from "@/components/ui/button";

type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  return ctor ?? null;
}

type BarcodeCameraScannerProps = {
  onDetected: (barcode: string) => void;
};

type ScannerState = "idle" | "starting" | "scanning" | "unsupported" | "denied";

export function BarcodeCameraScanner({ onDetected }: BarcodeCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<ScannerState>("idle");

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    const Detector = getBarcodeDetector();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setState("scanning");

      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      const scan = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const hit = results.find((r) => r.rawValue);
          if (hit) {
            stop();
            onDetected(hit.rawValue);
            return;
          }
        } catch {
          // Frame not ready yet — keep polling.
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch {
      stop();
      setState("denied");
    }
  }

  if (state === "unsupported") {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <CameraOff className="size-4 shrink-0" />
        Camera scanning isn&apos;t supported in this browser — enter the barcode
        number below instead.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <CameraOff className="size-4 shrink-0" />
        Camera access was blocked. Allow camera access in your browser settings,
        or enter the barcode number below.
      </p>
    );
  }

  if (state === "idle") {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={start}>
        <Camera className="size-4" /> Scan with camera
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-64 rounded-lg border-2 border-white/80" />
        </div>
        {state === "starting" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            Starting camera…
          </div>
        ) : null}
      </div>
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={stop}>
        Stop scanning
      </Button>
    </div>
  );
}
