import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  MEDIA_ORDER,
} from '@shinefold/config/constants';
import type {
  Module_featureHighlights,
  Module_logoWall,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterModule } from './starter-document';
import { localizedString, moduleHeadingBlock } from './starter-fields';
import { imageAsset, localizedImageWithAlt } from './starter-images';
import type { TModuleInput } from './starter-modules';
import { localizedListedText } from './starter-portable-text';

type THighlightsCopy = {
  heading: string;
  imageAlt: string;
  rows: readonly { heading: string; body: readonly string[] }[];
};

type TLogoWallCopy = { heading: string; logoNames: readonly string[] };

export function buildFeatureHighlightsModule({
  id,
  title,
  locale,
  highlights: { heading, imageAlt, rows },
  imageAssetId,
}: TModuleInput & {
  highlights: THighlightsCopy;
  imageAssetId: string;
}): TStarterModule<Module_featureHighlights> {
  return {
    _id: id,
    _type: 'module_featureHighlights',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    mediaOrder: MEDIA_ORDER.FIRST,
    highlights: rows.map((row, index) => ({
      _key: `highlight${index}`,
      _type: 'featureHighlight',
      heading: localizedString(locale, row.heading),
      body: localizedListedText(locale, row.body),
      image: localizedImageWithAlt(locale, imageAssetId, imageAlt),
    })),
  };
}

export function buildLogoWallModule({
  id,
  title,
  locale,
  logoWall: { heading, logoNames },
  logoAssetId,
}: TModuleInput & {
  logoWall: TLogoWallCopy;
  logoAssetId: string;
}): TStarterModule<Module_logoWall> {
  return {
    _id: id,
    _type: 'module_logoWall',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    logos: logoNames.map((name, index) => ({
      _key: `logo${index}`,
      _type: 'logoItem',
      name,
      image: imageAsset(logoAssetId),
    })),
  };
}
