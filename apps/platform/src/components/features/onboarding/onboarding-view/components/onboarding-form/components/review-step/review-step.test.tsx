import { LOCALE_ISO_CODES, PRESET_ID, SITE_TYPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_SITE_NAME,
  MOCK_TENANT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ReviewStep, type TReviewStepProps } from './review-step';

faker.seed(6331);

const {
  siteTypeLabel: SITE_TYPE_LABEL,
  nameLabel: NAME_LABEL,
  siteAddressLabel: SITE_ADDRESS_LABEL,
  languageLabel: LANGUAGE_LABEL,
  presetLabel: PRESET_LABEL,
  siteTypes: SITE_TYPES,
  edit: EDIT,
} = messages.onboardingForm;
const { acceptTerms: ACCEPT_TERMS, termsNotAccepted: TERMS_NOT_ACCEPTED } =
  messages.termsAcceptance;
const [ACCEPT_TERMS_LEAD] = ACCEPT_TERMS.split('<');
const t = makeEnTranslator('onboardingForm');
const tHue = makeEnTranslator('logoHueField');
const MOCK_HUE = faker.number.int({ min: 0, max: 360 });
const MOCK_ACCEPTANCE = { name: new RegExp(`^${ACCEPT_TERMS_LEAD}`) };

const setup = customRender(ReviewStep, {
  values: {
    siteType: SITE_TYPE.BLOG,
    name: MOCK_SITE_NAME,
    slug: faker.lorem.slug(),
    locale: LOCALE_ISO_CODES.EN,
    preset: PRESET_ID.EDITORIAL,
    accentHue: MOCK_HUE,
    hasAcceptedTerms: false,
  },
  siteAddress: MOCK_TENANT_DOMAIN,
  legalPageUrls: undefined,
  hasTermsError: false,
  onFieldChange: vi.fn(),
  onEdit: vi.fn(),
});

describe(`<${ReviewStep.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('lists the five answers in wizard order', () => {
    const terms = screen
      .getAllByRole('term')
      .map(({ textContent }) => textContent);

    expect(terms).toEqual([
      SITE_TYPE_LABEL,
      NAME_LABEL,
      SITE_ADDRESS_LABEL,
      LANGUAGE_LABEL,
      PRESET_LABEL,
    ]);
  });

  it('shows each answer beside its term', () => {
    const values = screen
      .getAllByRole('definition')
      .map(({ textContent }) => textContent);

    expect(values).toEqual(
      [
        SITE_TYPES.BLOG,
        MOCK_SITE_NAME,
        MOCK_TENANT_DOMAIN,
        messages.languageNames.EN,
        messages.presetPicker.editorial,
      ].map((value) => `${value}${EDIT}`),
    );
  });

  it('names the accent swatch by its hue', () => {
    const swatch = screen.getByRole('img', {
      name: tHue('hueValue', { hue: MOCK_HUE }),
    });

    expect(swatch).toBeVisible();
  });
});

describe(`<${ReviewStep.name}/> Edit`, () => {
  let user: UserEvent;
  let onEdit: Mock<TReviewStepProps['onEdit']>;

  beforeEach(() => {
    user = userEvent.setup();
    onEdit = vi.fn();
    setup({ onEdit });
  });

  it.each([
    [SITE_TYPE_LABEL, ONBOARDING_STEP.SITE],
    [NAME_LABEL, ONBOARDING_STEP.SITE],
    [SITE_ADDRESS_LABEL, ONBOARDING_STEP.ADDRESS],
    [LANGUAGE_LABEL, ONBOARDING_STEP.ADDRESS],
    [PRESET_LABEL, ONBOARDING_STEP.LOOK],
  ])('opens the step that asks for %s', async (field, step) => {
    const edit = screen.getByRole('button', {
      name: t('editField', { field }),
    });
    await user.click(edit);

    expect(onEdit).toHaveBeenCalledExactlyOnceWith(step);
  });
});

describe(`<${ReviewStep.name}/> without the terms accepted`, () => {
  beforeEach(() => {
    setup({ hasTermsError: true });
  });

  it('describes the terms box by its error', () => {
    const checkbox = screen.getByRole('checkbox', MOCK_ACCEPTANCE);

    expect(checkbox).toHaveAccessibleDescription(TERMS_NOT_ACCEPTED);
  });
});
