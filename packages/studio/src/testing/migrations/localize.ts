import {
  mockEnglishString,
  mockInEnglish,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';

export const mockImageAsset = () => ({
  _type: 'reference',
  _ref: faker.string.uuid(),
});

export const mockEnglishText = (value: string) =>
  mockInEnglish('internationalizedArrayTextValue', value);

export const mockPlainHeadingBlock = (
  heading: string,
  supportingText?: string,
) => ({
  _type: 'headingBlock',
  heading,
  ...(supportingText === undefined ? {} : { supportingText }),
});

export const mockLocalizedHeadingBlock = (
  heading: string,
  supportingText?: string,
) => ({
  _type: 'localizedHeadingBlock',
  heading: mockEnglishString(heading),
  ...(supportingText === undefined
    ? {}
    : { supportingText: mockEnglishText(supportingText) }),
});

export const mockPlainImage = (
  asset: ReturnType<typeof mockImageAsset>,
  alt: string,
) => ({ _type: 'imageWithAlt', asset, alt });

export const mockLocalizedImage = (
  asset: ReturnType<typeof mockImageAsset>,
  alt: string,
) => ({ _type: 'localizedImageWithAlt', asset, alt: mockEnglishString(alt) });
