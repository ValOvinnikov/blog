export type TUploadError =
  | {
      reason:
        | 'uploadsNotConfigured'
        | 'fileMissing'
        | 'unreadableImage'
        | 'unrecognizedTarget'
        | 'brandImageTypeUnsupported'
        | 'emailLogoSvg'
        | 'emailLogoWebp'
        | 'emailLogoTypeUnsupported';
    }
  | { reason: 'fileTooLarge'; values: { limit: string } }
  | { reason: 'imageTooSmall' | 'imageTooLarge'; values: { size: number } }
  | {
      reason: 'faviconNotSquare' | 'svgFaviconNotSquare';
      values: { width: number; height: number };
    }
  | {
      reason: 'uploadFailed' | 'removeFailed';
      values: { kind: 'logo' | 'favicon' };
    };
