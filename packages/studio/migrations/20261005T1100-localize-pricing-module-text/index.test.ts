import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizePricingModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const strings = (value: string) => [
  {
    _key: EN,
    _type: 'internationalizedArrayStringValue',
    language: EN,
    value,
  },
];

const feature = (key: string, text: string) => ({
  _key: key,
  _type: 'pricingFeature',
  text: strings(text),
});

const tierPath = (key: string, field: string) => [
  'tiers',
  { _key: key },
  field,
];

describe(localizePricingModule, () => {
  it('moves the heading, footnote and every tier text into the default language', () => {
    expect(
      localizePricingModule({
        headingBlock: { _type: 'headingBlock', heading: 'Plans' },
        tiers: [
          {
            _key: 'tier-pro',
            name: 'Pro',
            description: 'For growing teams',
            features: ['Unlimited posts', 'Priority support', 'Custom domain'],
            highlightLabel: 'Most popular',
            footnote: 'Billed annually',
          },
          {
            _key: 'tier-enterprise',
            name: 'Enterprise',
            priceLabel: 'Contact us',
          },
        ],
        footnote: 'Prices exclude VAT.',
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({ _type: 'localizedHeadingBlock', heading: strings('Plans') }),
      ),
      at(tierPath('tier-pro', 'name'), set(strings('Pro'))),
      at(
        tierPath('tier-pro', 'description'),
        set(strings('For growing teams')),
      ),
      at(
        tierPath('tier-pro', 'features'),
        set([
          feature('feature-1', 'Unlimited posts'),
          feature('feature-2', 'Priority support'),
          feature('feature-3', 'Custom domain'),
        ]),
      ),
      at(tierPath('tier-pro', 'highlightLabel'), set(strings('Most popular'))),
      at(tierPath('tier-pro', 'footnote'), set(strings('Billed annually'))),
      at(tierPath('tier-enterprise', 'name'), set(strings('Enterprise'))),
      at(tierPath('tier-enterprise', 'priceLabel'), set(strings('Contact us'))),
      at('footnote', set(strings('Prices exclude VAT.'))),
    ]);
  });

  it('localizes only the tiers still holding plain text', () => {
    expect(
      localizePricingModule({
        tiers: [
          {
            _key: 'tier-pro',
            name: strings('Pro'),
            features: [feature('feature-1', 'Unlimited posts')],
          },
          {
            _key: 'tier-team',
            name: 'Team',
            features: [feature('feature-1', 'SSO')],
          },
        ],
      }),
    ).toEqual([at(tierPath('tier-team', 'name'), set(strings('Team')))]);
  });

  it('is idempotent — an already localized module is left alone', () => {
    expect(
      localizePricingModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('Plans'),
        },
        tiers: [
          {
            _key: 'tier-pro',
            name: strings('Pro'),
            features: [
              feature('feature-1', 'Unlimited posts'),
              feature('feature-2', 'Priority support'),
            ],
            highlightLabel: strings('Most popular'),
          },
        ],
        footnote: strings('Prices exclude VAT.'),
      }),
    ).toBeUndefined();
  });

  it('leaves a module without text alone', () => {
    expect(localizePricingModule({})).toBeUndefined();
  });
});
