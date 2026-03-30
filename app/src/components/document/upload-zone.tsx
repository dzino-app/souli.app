"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function validateAndSelect(file: File) {
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(tc("error"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(tc("error"));
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  }

  function clearFile() {
    setSelectedFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (selectedFile) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={`border-dashed border-2 cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">{t("uploadTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("uploadDescription")}
          </p>
          <Button size="lg" onClick={(e) => e.stopPropagation()}>
            {t("uploadButton")}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            {t("uploadFormats")}
          </p>
        </CardContent>
      </Card>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        onChange={handleFileInput}
        className="hidden"
      />
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </>
  );
}
