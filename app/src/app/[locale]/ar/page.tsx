"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Video,
  Square,
  Download,
  Share2,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { useAvatarState } from "@/components/avatar/use-avatar-state";

type CaptureMode = "idle" | "recording" | "preview-photo" | "preview-video";

export default function ARPage() {
  const router = useRouter();
  const { mounted, state, appearance, name } = useAvatarState();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarLayerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [permission, setPermission] = useState<"idle" | "pending" | "granted" | "denied">("idle");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [mode, setMode] = useState<CaptureMode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");

  // Avatar position (user-draggable)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  async function startCamera(wantedFacing: "user" | "environment") {
    setPermission("pending");
    setError("");
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: wantedFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermission("granted");
    } catch (err) {
      setPermission("denied");
      setError(err instanceof Error ? err.message : "Nepodarilo sa otvoriť kameru");
    }
  }

  useEffect(() => {
    startCamera(facing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function flipCamera() {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    await startCamera(next);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const avatarLayer = avatarLayerRef.current;
    if (!video || !canvas || !avatarLayer) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw camera frame (fit to canvas)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw avatar layer by rasterizing SVG from DOM isn't trivial — instead use a simpler approach:
    // Render the avatar to a separate offscreen canvas via a DOM snapshot using html2canvas-style technique.
    // For simplicity: draw a small souli.app watermark + use foreignObject via SVG.
    // Since the PixelAvatar is composed of divs, we'll composite a SVG foreignObject approach below.

    // Add souli.app watermark
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeText("souli.app", canvas.width - 12, canvas.height - 12);
    ctx.fillText("souli.app", canvas.width - 12, canvas.height - 12);

    // For the avatar, we'll use svg-to-image trick via foreignObject
    const avatarHtml = avatarLayer.outerHTML;
    const avatarRect = avatarLayer.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;
    const ax = avatarRect.left - rect.left;
    const ay = avatarRect.top - rect.top;
    const aw = avatarRect.width;
    const ah = avatarRect.height;

    const svgData =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}">` +
      `<foreignObject x="${ax}" y="${ay}" width="${aw}" height="${ah}">` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${aw}px;height:${ah}px">` +
      avatarHtml +
      `</div></foreignObject></svg>`;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setPreviewBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            setMode("preview-photo");
          }
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => {
      // Fallback: just the camera + watermark (no avatar)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setPreviewBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            setMode("preview-photo");
          }
        },
        "image/jpeg",
        0.92,
      );
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setMode("preview-video");
    };
    recorder.start();
    recorderRef.current = recorder;
    setMode("recording");
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function sharePreview() {
    if (!previewBlob) return;
    const ext = mode === "preview-video" ? "webm" : "jpg";
    const type = mode === "preview-video" ? "video/webm" : "image/jpeg";
    const file = new File([previewBlob], `${name}-ar.${ext}`, { type });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${name} v reálnom svete`,
          text: "Môj Souli z souli.app",
        });
        return;
      } catch {
        // cancelled — fall through to download
      }
    }
    // Fallback download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(previewBlob);
    a.download = file.name;
    a.click();
  }

  function downloadPreview() {
    if (!previewBlob) return;
    const ext = mode === "preview-video" ? "webm" : "jpg";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(previewBlob);
    a.download = `${name}-ar.${ext}`;
    a.click();
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setMode("idle");
  }

  // Drag handlers for avatar positioning
  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPos({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
  }
  function onPointerUp(e: React.PointerEvent) {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-white font-semibold">AR režim</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={flipCamera}
          className="text-white hover:bg-white/10"
          disabled={permission !== "granted"}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {/* Camera stream */}
        {permission === "granted" && !previewUrl && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={facing === "user" ? { transform: "scaleX(-1)" } : {}}
          />
        )}

        {/* Photo preview */}
        {mode === "preview-photo" && previewUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Video preview */}
        {mode === "preview-video" && previewUrl && (
          <video
            src={previewUrl}
            autoPlay
            loop
            playsInline
            controls
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Permission states */}
        {permission === "pending" && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {permission === "denied" && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Card className="max-w-sm bg-card/95 backdrop-blur">
              <CardContent className="py-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <h2 className="font-bold">Prístup ku kamere zamietnutý</h2>
                <p className="text-sm text-muted-foreground">
                  {error || "Povoľ kameru v nastaveniach prehliadača a skús znova."}
                </p>
                <Button onClick={() => startCamera(facing)} className="w-full">
                  Skúsiť znova
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Draggable Souli overlay */}
        {permission === "granted" && !previewUrl && (
          <div
            ref={avatarLayerRef}
            className="absolute touch-none cursor-grab active:cursor-grabbing"
            style={{
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <PixelAvatar state={state} appearance={appearance} size="md" />
          </div>
        )}

        {/* Recording indicator */}
        {mode === "recording" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC
          </div>
        )}

        {/* Hint */}
        {permission === "granted" && !previewUrl && mode === "idle" && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur">
            Potiahni Souliho na správne miesto
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent">
        {previewUrl ? (
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Znova
            </Button>
            <Button onClick={sharePreview} className="gap-1.5">
              <Share2 className="h-4 w-4" />
              Zdieľať
            </Button>
            <Button variant="outline" onClick={downloadPreview} className="gap-1.5">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="lg"
              onClick={capturePhoto}
              disabled={permission !== "granted" || mode === "recording"}
              className="rounded-full w-14 h-14 bg-white hover:bg-white/90 border-4 border-white/40 text-black"
            >
              <Camera className="h-6 w-6" />
            </Button>
            {mode === "recording" ? (
              <Button
                size="lg"
                onClick={stopRecording}
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
              >
                <Square className="h-6 w-6 fill-white" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={permission !== "granted"}
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 border-4 border-white/40"
              >
                <Video className="h-6 w-6" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for photo compositing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
