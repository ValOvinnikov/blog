import {
  SHINEFOLD_LOGO_VARIANT,
  shinefoldLogoSvg,
} from '@blog/utils/shinefold-logo';

export const contentType = 'image/svg+xml';

export default function Icon() {
  return new Response(shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK), {
    headers: { 'Content-Type': contentType },
  });
}
