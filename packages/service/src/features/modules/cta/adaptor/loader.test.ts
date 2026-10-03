import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawCtaButton,
  makeRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawLocalizedEntries } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getCta } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getCta', () => {
  it('maps the cta module document', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawCtaModule({ ctaButtons: [makeRawCtaButton()] }),
    );

    const cta = await getCta('cta-1', tenant);

    expect(cta.headingBlock.heading).toBe('Subscribe to the newsletter');
    expect(cta.ctaButtons?.[0]?.link.href).toBe('/newsletter');
  });

  it('resolves each field in the tenant locale, falling back to its default', async () => {
    const { EN, NL } = LOCALE_ISO_CODES;
    mockRun.mockResolvedValueOnce(
      makeRawCtaModule({
        eyebrow: [
          { language: EN, value: 'Newsletter' },
          { language: NL, value: 'Nieuwsbrief' },
        ],
        footnote: makeRawLocalizedEntries('Unsubscribe any time.', EN),
      }),
    );

    const cta = await getCta(
      'cta-1',
      makeTenant({ locale: NL, defaultLocale: EN }),
    );

    expect(cta.eyebrow).toBe('Nieuwsbrief');
    expect(cta.footnote).toBe('Unsubscribe any time.');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getCta('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawCtaModule());

    await getCta('cta-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:cta',
            't:tenant-a:module:cta-1',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
            't:tenant-a:page_post',
            't:tenant-a:page_postIndex',
            't:tenant-a:page_topic',
            't:tenant-a:page_topicIndex',
            't:tenant-a:page_tag',
            't:tenant-a:page_tagIndex',
            't:tenant-a:topic',
          ],
        }),
      }),
    );
  });
});
