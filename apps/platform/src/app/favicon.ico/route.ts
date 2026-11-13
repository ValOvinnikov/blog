import { renderMarkPng } from '@platform/server/icons/render-mark-png';
import { toIco } from '@platform/server/icons/to-ico';

const ICO_CONTENT_TYPE = 'image/x-icon';
const FAVICON_SIDES = [16, 32, 48];

export async function GET() {
  const images = await Promise.all(
    FAVICON_SIDES.map(async (side) => ({
      side,
      png: new Uint8Array(await renderMarkPng(side).arrayBuffer()),
    })),
  );

  return new Response(toIco(images), {
    headers: { 'Content-Type': ICO_CONTENT_TYPE },
  });
}
