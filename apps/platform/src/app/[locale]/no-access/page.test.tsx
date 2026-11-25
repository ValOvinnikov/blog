import {
  NO_ACCESS_REASON,
  NO_ACCESS_SEARCH_PARAM,
  type TNoAccessReason,
} from '@platform/constants/no-access';
import { makeEnTranslator } from '@platform/testing/en-translator';
import type { TMaybeUndefined } from '@shinefold/config';

import NoAccessPage from './page';

const t = makeEnTranslator('noAccessPage');
const MOCK_UNKNOWN_REASON = 'UNKNOWN';

const renderPage = (reason: TMaybeUndefined<string>) =>
  NoAccessPage({
    searchParams: Promise.resolve({ [NO_ACCESS_SEARCH_PARAM.REASON]: reason }),
  });

const reasonCopy = (reason: TNoAccessReason) => ({
  badge: t('badge'),
  title: t(`${reason}.heading`),
  description: t(`${reason}.description`),
});

describe(`<${NoAccessPage.name}/>`, () => {
  it.each(Object.values(NO_ACCESS_REASON))(
    'explains the %s refusal',
    async (reason) => {
      const page = await renderPage(reason);

      expect(page.props).toEqual(reasonCopy(reason));
    },
  );

  it.each([undefined, MOCK_UNKNOWN_REASON])(
    'falls back to the plain site refusal for the %s reason',
    async (reason) => {
      const page = await renderPage(reason);

      expect(page.props).toEqual(reasonCopy(NO_ACCESS_REASON.SITE));
    },
  );

  it.each(Object.values(NO_ACCESS_REASON))(
    'never mentions seats for the %s refusal',
    async (reason) => {
      const page = await renderPage(reason);

      expect(Object.values(page.props).join(' ')).not.toMatch(/seat/i);
    },
  );
});
