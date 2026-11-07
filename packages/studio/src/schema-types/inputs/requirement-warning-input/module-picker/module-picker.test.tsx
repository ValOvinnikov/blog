/**
 * @vitest-environment jsdom
 */
import { MODULE_PACK } from '@blog/config/constants';
import { MODULE_PACK_LABEL } from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { createModulePicker } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker';
import { ModulePickerTypesContext } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-types-context';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { SchemaType } from 'sanity';

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

faker.seed(9156);

const ADD_ITEM_KEY = 'inputs.array.action.add-item-select-type';
const ALL_ITEMS_KEY = 'inputs.array.insert-menu.filter.all-items';
const SEARCH_KEY = 'inputs.array.insert-menu.search.placeholder';
const NO_RESULTS_KEY = 'inputs.array.insert-menu.search.no-results';
const MOCK_KEY = faker.string.alphanumeric(12);
const MOCK_GROUP = faker.lorem.word();
const MOCK_GROUP_TITLE = faker.lorem.words(2);
const CTA_TITLE = faker.lorem.words(3);
const FAQ_TITLE = `${faker.lorem.words(3)} ${faker.string.alpha(8)}`;
const PRICING_TITLE = `${faker.lorem.words(3)} ${faker.string.alpha(8)}`;

const CTA_TYPE = { name: ctaSchema.name, title: CTA_TITLE } as SchemaType;
const FAQ_TYPE = { name: faqSchema.name, title: FAQ_TITLE } as SchemaType;
const PRICING_TYPE = {
  name: pricingSchema.name,
  title: PRICING_TITLE,
} as SchemaType;
const TYPES = [CTA_TYPE, PRICING_TYPE, FAQ_TYPE];
const TITLES = [CTA_TITLE, PRICING_TITLE, FAQ_TITLE];
const GROWTH_LABEL = MODULE_PACK_LABEL[MODULE_PACK.GROWTH];

const ModulePicker = createModulePicker({
  entitledModulePacks: [MODULE_PACK.CORE],
});

const GrowthModulePicker = createModulePicker({
  entitledModulePacks: EVERY_MODULE_PACK,
});

type TPickerProps = ComponentProps<typeof ModulePicker>;

const onItemAppend = vi.fn();
const onValueCreate = vi.fn(() => ({ _key: MOCK_KEY }));

const renderPicker = ({
  types = TYPES,
  fieldTypes = TYPES,
  readOnly = false,
  Picker = ModulePicker,
}: {
  types?: SchemaType[];
  fieldTypes?: SchemaType[];
  readOnly?: boolean;
  Picker?: typeof ModulePicker;
} = {}) => {
  const props = {
    schemaType: {
      of: fieldTypes,
      options: {
        insertMenu: {
          filter: true,
          groups: [
            {
              name: MOCK_GROUP,
              title: MOCK_GROUP_TITLE,
              of: [FAQ_TYPE.name],
            },
          ],
        },
      },
    },
    readOnly,
    onItemAppend,
    onValueCreate,
  } as unknown as TPickerProps;

  render(
    <ThemeProvider theme={buildTheme()}>
      <ModulePickerTypesContext.Provider value={types}>
        <Picker {...props} />
      </ModulePickerTypesContext.Provider>
    </ThemeProvider>,
  );
};

const addButton = () =>
  screen.getByRole<HTMLButtonElement>('button', { name: ADD_ITEM_KEY });

const menuItem = (title: string) =>
  screen.getByRole<HTMLButtonElement>('menuitem', { name: title });

const expectMenuItems = (titles: string[]) => {
  const items = screen.getAllByRole('menuitem');

  expect(items).toEqual(titles.map(menuItem));
};

describe(`<${ModulePicker.name}/>`, () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }));
  });

  describe('when opened', () => {
    beforeEach(() => {
      renderPicker();
      fireEvent.click(addButton());
    });

    it('lists every module in its usual place', () => {
      expectMenuItems(TITLES);
    });

    it('disables a module outside the plan, described by the plan it needs', () => {
      const growthItem = screen.getByRole<HTMLButtonElement>('menuitem', {
        name: PRICING_TITLE,
        description: GROWTH_LABEL,
      });

      expect(growthItem.disabled).toBe(true);
    });

    it('leaves a module in the plan available, with no plan described', () => {
      const coreItem = screen.getByRole<HTMLButtonElement>('menuitem', {
        name: CTA_TITLE,
        description: '',
      });

      expect(coreItem.disabled).toBe(false);
    });

    it('appends an available module when chosen', () => {
      fireEvent.click(menuItem(CTA_TITLE));

      expect(onValueCreate).toHaveBeenCalledWith(CTA_TYPE);
      expect(onItemAppend).toHaveBeenCalledWith({ _key: MOCK_KEY });
    });

    it('appends nothing when a module outside the plan is clicked', () => {
      fireEvent.click(menuItem(PRICING_TITLE));

      expect(onItemAppend).not.toHaveBeenCalled();
    });

    it("shows only a kind's modules on its tab", () => {
      const kindTab = screen.getByRole('tab', { name: MOCK_GROUP_TITLE });

      fireEvent.click(kindTab);

      expectMenuItems([FAQ_TITLE]);
    });

    it('searches within the selected tab', () => {
      const kindTab = screen.getByRole('tab', { name: MOCK_GROUP_TITLE });
      const search = screen.getByPlaceholderText(SEARCH_KEY);

      fireEvent.click(kindTab);
      fireEvent.change(search, { target: { value: CTA_TITLE } });
      const noResults = screen.getByText(NO_RESULTS_KEY);

      expect(noResults).toBeTruthy();
    });

    it('returns to every module on the all tab', () => {
      const kindTab = screen.getByRole('tab', { name: MOCK_GROUP_TITLE });
      const allTab = screen.getByRole('tab', { name: ALL_ITEMS_KEY });

      fireEvent.click(kindTab);
      fireEvent.click(allTab);

      expectMenuItems(TITLES);
    });
  });

  it('disables nothing when every module pack is in the plan', () => {
    renderPicker({ Picker: GrowthModulePicker });
    fireEvent.click(addButton());

    expect(
      screen
        .getAllByRole<HTMLButtonElement>('menuitem')
        .map((item) => item.disabled),
    ).toEqual([false, false, false]);
  });

  it("lists the module types it is given over the field's own", () => {
    renderPicker({ fieldTypes: [CTA_TYPE, FAQ_TYPE, PRICING_TYPE] });
    fireEvent.click(addButton());

    expectMenuItems(TITLES);
  });

  it('disables the add button when the field is read-only', () => {
    renderPicker({ readOnly: true });

    expect(addButton().disabled).toBe(true);
  });
});
