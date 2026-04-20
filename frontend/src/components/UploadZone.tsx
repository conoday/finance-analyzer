"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFile: (file: File | "sample") => void;
}

export function UploadZone({ onFile }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] },
    multiple: false,
    onDragEnter: () => setDragging(true),
    onDragLeave: () => setDragging(false),
    onDropAccepted: () => setDragging(false),
    onDropRejected: () => setDragging(false),
  });

  // Strip all handlers framer-motion redefines with incompatible signatures.
  // The drop zone still works via onDrop/onDragEnter/onDragLeave/onDragOver
  // which do NOT conflict with framer-motion.
  const {
    onAnimationStart: _a,
    onDragStart: _ds,
    onDragEnd: _de,
    onDrag: _dg,
    ...safeRootProps
  } = getRootProps();

  return (
    <div className="w-full max-w-xl space-y-4">
      <motion.div
        {...safeRootProps}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative cursor-pointer rounded-2xl p-12 text-center border-2 border-dashed transition-all duration-300",
          isDragActive || dragging
            ? "border-blue-500 bg-blue-500/10 glow-blue"
            : "border-white/10 glass hover:border-blue-500/40 hover:bg-blue-500/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center"
          >
            {isDragActive ? (
              <FileSpreadsheet className="w-8 h-8 text-blue-400" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400" />
            )}
          </motion.div>
          <div className="space-y-1">
            <p className="text-slate-800 font-medium">
              {isDragActive ? "Lepaskan file di sini..." : "Drag & drop file mutasi rekening"}
            </p>
            <p className="text-slate-700 text-sm">CSV atau XLSX — klik untuk browse</p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 text-xs text-slate-800">
        <div className="flex-1 h-px bg-white/5" />
        <span>atau</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFile("sample")}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass border border-white/[0.06] text-sm text-slate-700 hover:text-slate-100 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
      >
        <Beaker className="w-4 h-4 text-indigo-400" />
        Gunakan Data Sampel
      </motion.button>
    </div>
  );
}
