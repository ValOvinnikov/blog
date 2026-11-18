import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, SANITY_WEBHOOK_OPERATION } from '@shinefold/config';

import { buildRedirectPaths } from './build-redirect-paths';

faker.seed(7572);

const { CREATE, UPDATE, DELETE } = SANITY_WEBHOOK_OPERATION;
const LANGUAGE = LOCALE_ISO_CODES.NL;
const [SOURCE, PREVIOUS_SOURCE] = faker.helpers.uniqueArray(
  () => `/${faker.lorem.slug()}`,
  2,
) as [string, string];

describe(buildRedirectPaths, () => {
  it.each([
    {
      operation: UPDATE,
      previousSource: PREVIOUS_SOURCE,
      paths: [SOURCE, PREVIOUS_SOURCE],
    },
    { operation: CREATE, previousSource: null, paths: [SOURCE] },
  ])(
    'builds the addresses of a $operation in the redirect’s language',
    ({ operation, previousSource, paths }) => {
      expect(
        buildRedirectPaths(operation, {
          source: SOURCE,
          previousSource,
          language: LANGUAGE,
        }),
      ).toEqual(paths.map((path) => ({ language: LANGUAGE, path })));
    },
  );

  it.each([
    {
      case: 'the previous source',
      redirect: { source: SOURCE, previousSource: PREVIOUS_SOURCE },
      path: PREVIOUS_SOURCE,
    },
    {
      case: 'the source when no previous source arrives',
      redirect: { source: SOURCE, previousSource: null },
      path: SOURCE,
    },
  ])('reads a deleted redirect’s address as $case', ({ redirect, path }) => {
    expect(
      buildRedirectPaths(DELETE, { ...redirect, language: LANGUAGE }),
    ).toEqual([{ language: LANGUAGE, path }]);
  });

  it.each([
    { case: 'an empty language', language: '' },
    { case: 'a null language', language: null },
    { case: 'no language', language: undefined },
  ])('builds nothing for $case', ({ language }) => {
    expect(buildRedirectPaths(UPDATE, { source: SOURCE, language })).toEqual(
      [],
    );
  });
});
