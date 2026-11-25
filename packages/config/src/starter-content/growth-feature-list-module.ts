import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  type TFeatureIconName,
} from '@shinefold/config/constants';
import type {
  Block_feature,
  Module_featureList,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion, TStarterModule } from './starter-document';
import type { TStarterDocument } from './starter-document-shape';
import { moduleHeadingBlock, moduleItemDocuments } from './starter-fields';
import type { TModuleInput } from './starter-modules';

type TFeatureListCopy = {
  heading: string;
  features: readonly { heading: string; supportingText: string }[];
};

export function buildFeatureListModule({
  id,
  title,
  locale,
  featureList: { heading, features },
  icons,
}: TModuleInput & {
  featureList: TFeatureListCopy;
  icons: readonly TFeatureIconName[];
}): TStarterDocumentUnion[] {
  const { documents, references } = moduleItemDocuments(
    id,
    'Feature',
    features,
    (feature, itemId, index) =>
      ({
        _id: itemId,
        _type: 'block_feature',
        title: feature.heading,
        headingBlock: moduleHeadingBlock(
          locale,
          feature.heading,
          feature.supportingText,
        ),
        icon: icons[index % icons.length],
      }) satisfies TStarterDocument<Block_feature, 'title' | 'headingBlock'>,
  );

  return [
    ...documents,
    {
      _id: id,
      _type: 'module_featureList',
      title,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      imageShape: CARD_IMAGE_SHAPE.ICON,
      cardAlignment: CONTENT_ALIGNMENT.LEFT,
      features: references,
    } satisfies TStarterModule<Module_featureList>,
  ];
}
