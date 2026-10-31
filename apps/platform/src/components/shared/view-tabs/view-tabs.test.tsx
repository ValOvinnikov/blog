import { faker } from '@faker-js/faker';
import { VIEW_TABS_VARIANT } from '@platform/constants/view-tabs';
import {
  customRender,
  renderHookWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { useViewTabs } from './use-view-tabs';
import { ViewTabs } from './view-tabs';

faker.seed(6389);

const DEFAULT_NAME = 'Edit or preview';
const EDIT_TAB = 'Edit';
const PREVIEW_TAB = 'Preview';
const MOCK_NAME = faker.lorem.words(2);
const ARIA_SELECTED = 'aria-selected';
const MOCK_IDS = {
  edit: { tab: faker.string.alpha(8), panel: faker.string.alpha(8) },
  preview: { tab: faker.string.alpha(8), panel: faker.string.alpha(8) },
};

const setup = customRender(ViewTabs, {
  value: 'edit',
  onChange: vi.fn(),
  ids: MOCK_IDS,
});

const stubMatchMedia = window.matchMedia;

const stubDesktop = () => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    matches: true,
  }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`<${ViewTabs.name}/>`, () => {
  it('names the tablist "Edit or preview" by default', () => {
    setup();

    const tabList = screen.queryByRole('tablist', { name: DEFAULT_NAME });

    expect(tabList).toBeInTheDocument();
  });

  it('names the tablist with the name the caller gives', () => {
    setup({ ariaLabel: MOCK_NAME });

    const tabList = screen.queryByRole('tablist', { name: MOCK_NAME });

    expect(tabList).toBeInTheDocument();
  });

  it.each(Object.values(VIEW_TABS_VARIANT))(
    'marks the selected tab in the %s variant',
    (variant) => {
      setup({ variant, value: 'preview' });

      const tabList = screen.getByRole('tablist');
      const previewTab = within(tabList).getByRole('tab', {
        name: PREVIEW_TAB,
      });
      const editTab = within(tabList).getByRole('tab', { name: EDIT_TAB });

      expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'false');
    },
  );

  it('reports the tab the user picks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ variant: VIEW_TABS_VARIANT.UNDERLINE, isSticky: true, onChange });

    const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });

    await user.click(previewTab);

    expect(onChange).toHaveBeenCalledWith('preview');
  });

  it('shows no tabs when the caller says the layout is not tabbed', () => {
    setup({ isTabbed: false });

    const tabList = screen.queryByRole('tablist');

    expect(tabList).not.toBeInTheDocument();
  });
});

describe(useViewTabs.name, () => {
  it('gives the panels tabpanel roles below lg when the caller does not decide', () => {
    const { result } = renderHookWithIntl(() => useViewTabs());

    expect(result.current.panelProps('edit').role).toBe('tabpanel');
  });

  it('drops the tabpanel roles from lg when the caller does not decide', () => {
    stubDesktop();
    const { result } = renderHookWithIntl(() => useViewTabs());

    expect(result.current.panelProps('edit').role).toBeUndefined();
  });

  it('keeps the tabpanel roles from lg while the caller says the layout is tabbed', () => {
    stubDesktop();
    const { result } = renderHookWithIntl(() =>
      useViewTabs({ isTabbed: true }),
    );
    const { panelProps, tabsProps } = result.current;

    expect(panelProps('preview').role).toBe('tabpanel');
    expect(panelProps('preview')['aria-labelledby']).toBe(
      tabsProps.ids.preview.tab,
    );
  });

  it('drops the tabpanel roles below lg while the caller says the layout is not tabbed', () => {
    const { result } = renderHookWithIntl(() =>
      useViewTabs({ isTabbed: false }),
    );

    expect(result.current.panelProps('edit').role).toBeUndefined();
    expect(result.current.tabsProps.isTabbed).toBe(false);
  });
});
