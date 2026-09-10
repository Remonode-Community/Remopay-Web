'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supportService } from '@/services/support.service';
import { useUIStore } from '@/store/ui.store';

interface FileUploaderProps {
  attachments: { url: string; type: string; name?: string }[];
  onChange: (attachments: { url: string; type: string; name?: string }[]) => void;
  maxFiles?: number;
}

export function FileUploader({ attachments, onChange, maxFiles = 5 }: FileUploaderProps) {
  const { addToast } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxFiles - attachments.length;
    if (remaining <= 0) {
      addToast({ type: 'error', message: `Maximum ${maxFiles} files allowed.` });
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    const newAttachments: { url: string; type: string; name?: string }[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        addToast({ type: 'error', message: `${file.name} is not an image file.` });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast({ type: 'error', message: `${file.name} exceeds 10MB limit.` });
        continue;
      }

      try {
        const res = await supportService.uploadAttachment(file);
        if (res.success && res.data?.attachment_url) {
          newAttachments.push({
            url: res.data.attachment_url,
            type: res.data.attachment_type,
            name: file.name,
          });
        } else {
          addToast({ type: 'error', message: res.message || `Failed to upload ${file.name}.` });
        }
      } catch {
        addToast({ type: 'error', message: `Failed to upload ${file.name}.` });
      }
    }

    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
      addToast({ type: 'success', message: `${newAttachments.length} file(s) uploaded.` });
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Uploaded previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={att.url}
                alt={att.name || 'Attachment'}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {attachments.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-left transition hover:border-[#d71927]/40 hover:bg-red-50/20 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#d71927]" />
          ) : (
            <Upload className="h-5 w-5 shrink-0 text-gray-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Attach screenshots'}
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WEBP up to 10MB ({attachments.length}/{maxFiles})
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
