'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  type?: 'cover' | 'inline';
  aspect?: string;
}

export function ImageUploader({
  value,
  onChange,
  label = 'Image',
  type = 'cover',
  aspect = 'aspect-video',
}: ImageUploaderProps) {
  const { addToast } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Please select an image file.' });
      return;
    }
    setUploading(true);
    try {
      const res = await blogService.uploadImage(file, type);
      if (res.success && res.data?.image_url) {
        onChange(res.data.image_url);
        addToast({ type: 'success', message: 'Image uploaded successfully.' });
      } else {
        addToast({ type: 'error', message: res.message || 'Upload failed.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <div className={`${aspect} w-full bg-gray-100`}>
            <Image
              src={value}
              alt={label}
              width={800}
              height={450}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-[#d71927] hover:text-[#d71927] disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-gray-400">JPG, PNG, WEBP · up to 10 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
