import { LINK_TYPE, SOCIAL_PLATFORMS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import {
  buildLinkRef,
  buildSocialProfile,
  hasRecognizedLinkShape,
  hasResolvableUrl,
  LINK_REF_TYPE,
  SOCIAL_PROFILE_TYPE,
} from './transform';

faker.seed(6019);

const MOCK_KEY = faker.string.uuid();
const MOCK_LINK_ID = faker.string.uuid();
const MOCK_LABEL = faker.lorem.words(2);
const MOCK_URL = faker.internet.url();
const MOCK_RELATIVE_URL = `/${faker.lorem.word()}`;

describe(buildLinkRef, () => {
  it('preserves the original key and points at the given link id', () => {
    const item = {
      _key: MOCK_KEY,
      label: MOCK_LABEL,
      linkType: LINK_TYPE.INTERNAL,
    };

    expect(buildLinkRef(item, MOCK_LINK_ID)).toEqual({
      _key: MOCK_KEY,
      _type: LINK_REF_TYPE,
      link: { _type: 'reference', _ref: MOCK_LINK_ID },
    });
  });
});

describe(buildSocialProfile, () => {
  it('preserves the original key and platform, referencing the link id', () => {
    const item = {
      _key: MOCK_KEY,
      label: MOCK_LABEL,
      linkType: LINK_TYPE.EXTERNAL,
      platform: SOCIAL_PLATFORMS.LINKEDIN,
    };

    expect(buildSocialProfile(item, MOCK_LINK_ID)).toEqual({
      _key: MOCK_KEY,
      _type: SOCIAL_PROFILE_TYPE,
      platform: SOCIAL_PLATFORMS.LINKEDIN,
      link: { _type: 'reference', _ref: MOCK_LINK_ID },
    });
  });
});

describe(hasRecognizedLinkShape, () => {
  it.each([
    {
      title: 'the pre-rename link _type',
      item: { _type: 'link' },
      expected: true,
    },
    {
      title: 'the post-rename inlineLink _type',
      item: { _type: 'inlineLink' },
      expected: true,
    },
    { title: 'an entry with no _type', item: {}, expected: true },
    {
      title: 'any other _type',
      item: { _type: LINK_REF_TYPE },
      expected: false,
    },
  ])('recognizes $title: $expected', ({ item, expected }) => {
    expect(hasRecognizedLinkShape(item)).toBe(expected);
  });
});

describe(hasResolvableUrl, () => {
  it.each([
    {
      title: 'an internal link regardless of url',
      item: { linkType: LINK_TYPE.INTERNAL },
      expected: true,
    },
    {
      title: 'a full https url with a host',
      item: { linkType: LINK_TYPE.EXTERNAL, url: MOCK_URL },
      expected: true,
    },
    {
      title: 'a relative path',
      item: { linkType: LINK_TYPE.EXTERNAL, url: MOCK_RELATIVE_URL },
      expected: false,
    },
    {
      title: 'a missing url',
      item: { linkType: LINK_TYPE.EXTERNAL },
      expected: false,
    },
  ])('resolves $title: $expected', ({ item, expected }) => {
    expect(hasResolvableUrl(item)).toBe(expected);
  });
});
