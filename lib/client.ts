export async function api(
  path: string,
  method = 'GET',
  body?: unknown,
  token?: string,
) {
  const r = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export async function compressPhoto(file: File): Promise<File> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 10000000
  )
    throw new Error('Choose a JPG, PNG or WebP photo under 10 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error('Could not prepare this image.')),
      'image/jpeg',
      0.82,
    ),
  );
  if (blob.size > 2000000)
    throw new Error(
      'This photo is too large after compression. Please use a smaller image.',
    );
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
