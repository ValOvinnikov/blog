/**
 * @vitest-environment jsdom
 */
import { MODULE_PACK } from '@blog/config/constants';
import {
  getLockedModulesNote,
  getModulePackPlanLabel,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { createModulePicker } from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

faker.seed(9156);

const ADD_ITEM_KEY = 'inputs.array.action.add-item-select-type';
const MOCK_KEY = faker.string.alphanumeric(12);
const CTA_TITLE = getModuleTitle(ctaSchema.name);
const PRICING_TITLE = getModuleTitle(pricingSchema.name);
const GROWTH_PLAN = getModulePackPlanLabel(MODULE_PACK.GROWTH);
const CTA_TYPE = { name: ctaSchema.name, title: CTA_TITLE };
const PRICING_TYPE = { name: pricingSchema.name, title: PRICING_TITLE };

const ModulePicker = createModulePicker({
  entitledModulePacks: [MODULE_PACK.CORE],
});

type TPickerProps = ComponentProps<typeof ModulePicker>;

const onItemAppend = vi.fn();
const onValueCreate = vi.fn(() => ({ _key: MOCK_KEY }));

const renderPicker = (overrides: Partial<TPickerProps> = {}) => {
  const props = {
    schemaType: { of: [CTA_TYPE, PRICING_TYPE] },
    onItemAppend,
    onValueCreate,
    ...overrides,
  } as unknown as TPickerProps;

  render(
    <ThemeProvider theme={buildTheme()}>
      <ModulePicker {...props} />
    </ThemeProvider>,
  );
};

const menuItem = (title: string) =>
  screen.getByRole<HTMLButtonElement>('menuitem', {
    name: new RegExp(title),
  });

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
      const addButton = screen.getByRole('button', { name: ADD_ITEM_KEY });
      fireEvent.click(addButton);
    });

    it('shows a growth module as unavailable, labelled with its plan', () => {
      const pricing = menuItem(PRICING_TITLE);
      const cta = menuItem(CTA_TITLE);

      expect(pricing.disabled).toBe(true);
      expect(pricing.textContent).toContain(GROWTH_PLAN);
      expect(cta.disabled).toBe(false);
    });

    it('appends an available module when chosen', () => {
      const cta = menuItem(CTA_TITLE);

      fireEvent.click(cta);

      expect(onValueCreate).toHaveBeenCalledWith(CTA_TYPE);
      expect(onItemAppend).toHaveBeenCalledWith({ _key: MOCK_KEY });
    });

    it('notes that locked modules come with their plan', () => {
      const note = screen.getByText(getLockedModulesNote(MODULE_PACK.GROWTH));

      expect(note).toBeTruthy();
    });

    it('appends nothing when a growth module is clicked', () => {
      const pricing = menuItem(PRICING_TITLE);

      fireEvent.click(pricing);

      expect(onItemAppend).not.toHaveBeenCalled();
    });
  });

  it('disables the add button when the field is read-only', () => {
    renderPicker({ readOnly: true });

    const addButton = screen.getByRole<HTMLButtonElement>('button', {
      name: ADD_ITEM_KEY,
    });

    expect(addButton.disabled).toBe(true);
  });
});
