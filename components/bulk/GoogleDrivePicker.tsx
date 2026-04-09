"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

interface GoogleDrivePickerProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

/**
 * Placeholder Google Drive Picker component.
 * Full implementation requires Google OAuth and Drive API configuration.
 */
export default function GoogleDrivePicker({ onFileSelect, isLoading }: GoogleDrivePickerProps) {
  return (
    <button
      type="button"
      disabled={isLoading}
      title="Fitur Google Drive membutuhkan konfigurasi OAuth"
      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-400 rounded-xl font-bold cursor-not-allowed opacity-60 whitespace-nowrap"
    >
      <FolderOpen className="w-5 h-5" />
      Import dari Drive
    </button>
  );
}
