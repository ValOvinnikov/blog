// A 1x1 transparent PNG — satisfies the schema's required image fields
// (author avatar, default OG image) when seeding a brand-new tenant with no
// real media yet. The operator replaces these in the Studio afterward.
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export function placeholderPngBuffer(): Buffer {
  return Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64');
}
