'use client';

import { useRef, useState } from 'react';

type Props = {
  images: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  maxBytes?: number;
};

export function ImagePicker({
  images,
  onChange,
  maxImages = 5,
  maxBytes = 5 * 1024 * 1024,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const next: File[] = [...images];
    for (const f of Array.from(files)) {
      if (next.length >= maxImages) {
        setError(`Max ${maxImages} images`);
        break;
      }
      if (!f.type.startsWith('image/')) {
        setError(`${f.name} is not an image`);
        continue;
      }
      if (f.size > maxBytes) {
        setError(`${f.name} is too large (max 5 MB)`);
        continue;
      }
      next.push(f);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (i: number) => {
    const next = images.filter((_, idx) => idx !== i);
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((file, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-primary-light"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-white flex flex-col items-center justify-center text-ink-muted hover:border-primary hover:text-primary transition"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[10px] font-bold mt-1">
              {images.length}/{maxImages}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}