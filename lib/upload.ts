/** Upload one file via the app's /upload route. Returns the URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/upload', {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message?.toString?.() || 'Upload failed');
  }

  const data = await res.json();
  const url = data.url as string | undefined;
  if (!url) throw new Error('Upload succeeded but no URL returned');
  return url;
}

/** Upload several files sequentially (safer than parallel for slow networks). */
export async function uploadImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    urls.push(await uploadImage(files[i]));
    onProgress?.(i + 1, files.length);
  }
  return urls;
}