export const MOCK_MIME_TYPE = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
} as const;

export const buildPngBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(33);
  buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = 6;
  return buffer;
};
