import {
  LINK_TYPE,
  type CookiePreferencesLink,
  type LinkRef,
} from '@blog/config';
import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_EXTERNAL_URL,
  MOCK_LINK_LABEL,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { portableTextMarkDefFragment } from './portable-text-mark-def';

faker.seed(6507);

const { EN } = LOCALE_ISO_CODES;

const MOCK_LINK_ID = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();

const markDefQuery = q.star
  .filterByType(
    PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
  )
  .slice(0)
  .as<{ _key: string } & (LinkRef | CookiePreferencesLink)>()
  .project(portableTextMarkDefFragment);

const linkDocument = {
  _id: MOCK_LINK_ID,
  _type: 'link',
  linkType: LINK_TYPE.EXTERNAL,
  label: mockLocalizedStrings({ [EN]: MOCK_LINK_LABEL }),
  url: mockLocalizedStrings({ [EN]: MOCK_EXTERNAL_URL }),
};

async function projectMarkDef(markDef: Record<string, unknown>) {
  const raw = await evaluateGroqExpression(
    markDefQuery.query,
    [{ _key: MOCK_MARK_KEY, ...markDef }, linkDocument],
    undefined,
    { locale: EN, defaultLocale: EN },
  );

  return markDefQuery.parse(raw);
}

describe('portableTextMarkDefFragment', () => {
  it('projects a cookie-preferences mark as its key and type alone', async () => {
    const markDef = await projectMarkDef({
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
    });

    expect(markDef).toEqual({
      _key: MOCK_MARK_KEY,
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
    });
  });

  it('dereferences a link mark to its link document', async () => {
    const markDef = await projectMarkDef({
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: mockReference(MOCK_LINK_ID),
    });

    expect(markDef).toMatchObject({
      _key: MOCK_MARK_KEY,
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: { url: MOCK_EXTERNAL_URL },
    });
  });
});
