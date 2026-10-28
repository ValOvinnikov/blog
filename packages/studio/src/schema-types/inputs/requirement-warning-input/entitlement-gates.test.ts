import {
  CAPABILITY,
  MODULE_PACK,
  type TCapability,
  type TModulePack,
} from '@blog/config/constants';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { entitlementGates } from '@blog/studio/schema-types/inputs/requirement-warning-input/entitlement-gates';
import {
  getRequirementOffMessage,
  type TEntitlementState,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { markRequirementOffTypes } from '@blog/studio/schema-types/inputs/requirement-warning-input/mark-requirement-off-types';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { InputProps, ItemProps, TemplateItem } from 'sanity';

faker.seed(6017);

const MOCK_DEFAULT_INPUT = faker.lorem.words(3);
const MOCK_MODULE_KEY = faker.string.alphanumeric(12);

const NEWSLETTER_TYPE = newsletterSchema.name;
const PRICING_TYPE = pricingSchema.name;
const CORE_ONLY = [MODULE_PACK.CORE];
const NEWSLETTER_OFF_MARKUP = renderToStaticMarkup(
  getRequirementOffMessage({ capability: CAPABILITY.NEWSLETTER }),
);
const PRICING_OFF_MARKUP = renderToStaticMarkup(
  getRequirementOffMessage({ modulePack: MODULE_PACK.GROWTH }),
);

const getGates = (entitlements: TEntitlementState) => {
  const { form, document } = entitlementGates(entitlements);
  const newDocumentOptions = document?.newDocumentOptions;
  if (
    !form?.components?.input ||
    !form.components.item ||
    typeof newDocumentOptions !== 'function'
  ) {
    throw new Error('entitlement gates not registered');
  }

  return {
    input: form.components.input,
    item: form.components.item,
    newDocumentOptions: (items: TemplateItem[]) =>
      newDocumentOptions(items, {} as Parameters<typeof newDocumentOptions>[1]),
  };
};

const capabilityState = (
  enabledCapabilities: TCapability[],
): TEntitlementState => ({
  enabledCapabilities,
  entitledModulePacks: EVERY_MODULE_PACK,
});

const packState = (
  entitledModulePacks: readonly TModulePack[],
): TEntitlementState => ({ entitledModulePacks });

const renderRootInput = (
  entitlements: TEntitlementState,
  typeName: string,
  path: InputProps['path'] = [],
) => {
  const { input } = getGates(entitlements);
  const props = {
    path,
    schemaType: { name: typeName },
    renderDefault: () => createElement('div', null, MOCK_DEFAULT_INPUT),
  } as unknown as InputProps;

  return renderToStaticMarkup(
    createElement(
      ThemeProvider,
      { theme: buildTheme() },
      createElement(input, props),
    ),
  );
};

const renderItemValidation = (
  entitlements: TEntitlementState,
  typeName: string,
) => {
  const { item } = getGates(entitlements);
  const renderDefault = vi.fn<(props: ItemProps) => ReactElement>(() =>
    createElement('div'),
  );
  const props = {
    path: ['modules', { _key: MOCK_MODULE_KEY }],
    schemaType: { name: typeName },
    validation: [],
    renderDefault,
  } as unknown as ItemProps;

  renderToStaticMarkup(createElement(item, props));

  const [renderedProps] = renderDefault.mock.calls.map(([props]) => props);

  return renderedProps?.validation;
};

describe(entitlementGates, () => {
  describe('document banner', () => {
    it('shows the banner above the form when Newsletter is absent', () => {
      const html = renderRootInput(
        capabilityState([CAPABILITY.COMMENTS]),
        NEWSLETTER_TYPE,
      );

      expect(html).toContain(NEWSLETTER_OFF_MARKUP);
      expect(html.indexOf(NEWSLETTER_OFF_MARKUP)).toBeLessThan(
        html.indexOf(MOCK_DEFAULT_INPUT),
      );
    });

    it('shows no banner when Newsletter is present', () => {
      const html = renderRootInput(
        capabilityState([CAPABILITY.NEWSLETTER]),
        NEWSLETTER_TYPE,
      );

      expect(html).not.toContain(NEWSLETTER_OFF_MARKUP);
      expect(html).toContain(MOCK_DEFAULT_INPUT);
    });

    it('shows no banner on nested inputs', () => {
      const html = renderRootInput(capabilityState([]), NEWSLETTER_TYPE, [
        'title',
      ]);

      expect(html).not.toContain(NEWSLETTER_OFF_MARKUP);
    });

    it.each([
      { packs: 'core alone', entitledModulePacks: CORE_ONLY, shown: true },
      {
        packs: 'every pack',
        entitledModulePacks: EVERY_MODULE_PACK,
        shown: false,
      },
    ])(
      'shows the plan banner on a growth module on $packs: $shown',
      ({ entitledModulePacks, shown }) => {
        const html = renderRootInput(
          packState(entitledModulePacks),
          PRICING_TYPE,
        );

        expect(html.includes(PRICING_OFF_MARKUP)).toBe(shown);
        expect(html).toContain(MOCK_DEFAULT_INPUT);
      },
    );
  });

  it('marks a gated module in the picker', () => {
    const entitlements = packState(CORE_ONLY);
    const { input } = getGates(entitlements);
    const of = [{ name: PRICING_TYPE, title: pricingSchema.title }];
    const renderDefault = vi.fn<(props: InputProps) => ReactElement>(() =>
      createElement('div'),
    );
    const props = {
      path: ['modules'],
      schemaType: { name: 'array', jsonType: 'array', of },
      renderDefault,
    } as unknown as InputProps;

    renderToStaticMarkup(createElement(input, props));

    const [renderedProps] = renderDefault.mock.calls.map(([props]) => props);
    const [markedType] = (renderedProps?.schemaType as { of: typeof of }).of;
    const [expectedType] = markRequirementOffTypes(of, entitlements)!;

    expect(markedType?.title).toBe(expectedType?.title);
  });

  describe('page item warning', () => {
    it.each([
      {
        state: 'off',
        enabledCapabilities: [CAPABILITY.COMMENTS],
        warned: true,
      },
      {
        state: 'on',
        enabledCapabilities: [CAPABILITY.NEWSLETTER],
        warned: false,
      },
    ])(
      'warns only when its capability is $state',
      ({ enabledCapabilities, warned }) => {
        const expectedWarning = {
          level: 'warning',
          message: getRequirementOffMessage({
            capability: CAPABILITY.NEWSLETTER,
          }),
          path: ['modules', { _key: MOCK_MODULE_KEY }],
        };

        expect(
          renderItemValidation(
            capabilityState(enabledCapabilities),
            NEWSLETTER_TYPE,
          ),
        ).toEqual(warned ? [expectedWarning] : []);
      },
    );

    it('leaves an off-plan module to the modules field validation', () => {
      expect(renderItemValidation(packState(CORE_ONLY), PRICING_TYPE)).toEqual(
        [],
      );
    });
  });

  describe('new documents', () => {
    const coreItem = { templateId: newsletterSchema.name } as TemplateItem;
    const growthItem = { templateId: PRICING_TYPE } as TemplateItem;
    const otherItem = {
      templateId: migrationStateSchema.name,
    } as TemplateItem;
    const items = [coreItem, growthItem, otherItem];

    it('drops module types outside the entitled packs', () => {
      expect(getGates(packState(CORE_ONLY)).newDocumentOptions(items)).toEqual([
        coreItem,
        otherItem,
      ]);
    });

    it('keeps every module type when every pack is entitled', () => {
      expect(
        getGates(packState(EVERY_MODULE_PACK)).newDocumentOptions(items),
      ).toEqual(items);
    });
  });
});
