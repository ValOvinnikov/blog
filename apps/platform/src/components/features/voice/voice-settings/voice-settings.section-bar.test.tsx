import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  VOICE_BAR_HEIGHT_PROPERTY,
  VOICE_SECTION,
  VOICE_SECTION_BAR_FADE_END_TEST_ID,
  VOICE_SECTION_BAR_FADE_START_TEST_ID,
  VOICE_SECTION_ID,
} from '@platform/constants/voice';
import messages from '@platform/i18n/messages/en.json';
import {
  ARIA_CONTROLS,
  ARIA_CURRENT,
  ARIA_EXPANDED,
  ARIA_HIDDEN,
} from '@platform/testing/aria';
import {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { stubMatchingMediaQuery } from '@platform/testing/match-media';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_ARCHIVED_AT } from '@platform/testing/tenants/fixtures';
import {
  EMPTY_STATES_SECTION,
  ERROR_PAGES_SECTION,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  setupBilingualVoiceSettings,
  setupVoiceSettings,
} from '@platform/testing/voice/voice-settings-setup';
import { voiceSectionHref } from '@platform/utils/voice-sections/voice-sections';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const { voiceSettings: VOICE_SETTINGS } = messages;

const ERRORS_IDS = VOICE_SECTION_ID[VOICE_SECTION.ERROR_PAGES];
const EMPTY_IDS = VOICE_SECTION_ID[VOICE_SECTION.EMPTY_STATES];
const SECTION_BODY_IDS = `${ERRORS_IDS.body} ${EMPTY_IDS.body}`;
const HREF = 'href';
const ACTIVE = 'true';
const IN_FLOW_BAR_TOP = 100;
const BAR_HEIGHT = 50;
const SECTION_GAP = 20;
const ABOVE_LINE = 10;
const BELOW_LINE = 400;
const TRACK_WIDTH = 120;
const LIST_WIDTH = 300;
const SCROLL_TO_START = { behavior: 'smooth', block: 'start' };

const sectionBar = () =>
  screen.getByRole('region', { name: VOICE_SETTINGS.sectionsRegionLabel });

const sectionNav = () =>
  within(sectionBar()).getByRole('navigation', {
    name: VOICE_SETTINGS.sectionsNavLabel,
  });

const chip = (name: string) =>
  within(sectionNav()).getByRole('link', { name: new RegExp(`^${name}`) });

const barButton = (name: string) =>
  within(sectionBar()).getByRole('button', { name });

const expectEverySection = (isOpen: boolean) => {
  for (const name of [ERROR_PAGES_SECTION, EMPTY_STATES_SECTION]) {
    expect(voiceSectionHeader(name)).toHaveAttribute(
      ARIA_EXPANDED,
      String(isOpen),
    );
  }
};

const placeHeaders = (
  errorsTop: number,
  emptyTop: number,
  barBox?: { element: Element; top: number; bottom: number },
) => {
  const tops: Record<string, number> = {
    [ERRORS_IDS.heading]: errorsTop,
    [EMPTY_IDS.heading]: emptyTop,
  };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      if (this === barBox?.element) {
        return { top: barBox.top, bottom: barBox.bottom } as DOMRect;
      }
      const top = tops[this.id] ?? 0;
      return { top, bottom: top } as DOMRect;
    },
  );
  fireEvent.scroll(window);
};

const placeBarInFlowAboveSections = () => {
  const bar = sectionBar();
  vi.spyOn(bar, 'offsetHeight', 'get').mockReturnValue(BAR_HEIGHT);
  const barBottom = IN_FLOW_BAR_TOP + BAR_HEIGHT;
  placeHeaders(barBottom + SECTION_GAP, BELOW_LINE * 2, {
    element: bar,
    top: IN_FLOW_BAR_TOP,
    bottom: barBottom,
  });
};

const scrollToPageEnd = () => {
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(BELOW_LINE);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(
    BELOW_LINE + window.innerHeight,
  );
};

const scrollChipList = (scrollLeft: number) => {
  const list = within(sectionNav()).getByRole('list');
  Object.defineProperties(list, {
    clientWidth: { configurable: true, value: TRACK_WIDTH },
    scrollWidth: { configurable: true, value: LIST_WIDTH },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });
  fireEvent.scroll(list);
};

describe(`<${VoiceSettings.name}/> section bar`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', window.location.pathname);
  });

  describe('with nothing customised', () => {
    beforeEach(() => {
      setupVoiceSettings();
    });

    it('links one chip to each section', () => {
      const errorPages = chip(ERROR_PAGES_SECTION);
      const emptyStates = chip(EMPTY_STATES_SECTION);

      expect(errorPages).toHaveAttribute(HREF, `#${ERRORS_IDS.section}`);
      expect(emptyStates).toHaveAttribute(HREF, `#${EMPTY_IDS.section}`);
    });

    it('shows no count on any chip', () => {
      const errorPages = chip(ERROR_PAGES_SECTION);
      const emptyStates = chip(EMPTY_STATES_SECTION);

      expect(errorPages).toHaveAccessibleName(ERROR_PAGES_SECTION);
      expect(emptyStates).toHaveAccessibleName(EMPTY_STATES_SECTION);
    });

    it('marks no chip active before a header reaches the bar', async () => {
      placeHeaders(BELOW_LINE, BELOW_LINE * 2);

      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).not.toHaveAttribute(ARIA_CURRENT),
      );
      expect(chip(ERROR_PAGES_SECTION)).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('marks no chip active at the top of the page, with the bar in flow above the first header', async () => {
      placeHeaders(-BELOW_LINE, -BELOW_LINE);
      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).toHaveAttribute(
          ARIA_CURRENT,
          ACTIVE,
        ),
      );

      placeBarInFlowAboveSections();

      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).not.toHaveAttribute(ARIA_CURRENT),
      );
      expect(chip(ERROR_PAGES_SECTION)).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('marks the last section whose header passed the line active', async () => {
      placeHeaders(-BELOW_LINE, ABOVE_LINE);

      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).toHaveAttribute(
          ARIA_CURRENT,
          ACTIVE,
        ),
      );
      expect(chip(ERROR_PAGES_SECTION)).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('marks the last section with its header in view active at the end of the page', async () => {
      scrollToPageEnd();
      placeHeaders(ABOVE_LINE, BELOW_LINE);

      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).toHaveAttribute(
          ARIA_CURRENT,
          ACTIVE,
        ),
      );
    });

    it('jumps from a chip: opens the section, focuses its header and replaces the hash', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');

      await user.click(chip(EMPTY_STATES_SECTION));

      const header = voiceSectionHeader(EMPTY_STATES_SECTION);
      expect(header).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(header).toHaveFocus();
      expect(chip(EMPTY_STATES_SECTION)).toHaveAttribute(ARIA_CURRENT, ACTIVE);
      expect(scrollIntoView).toHaveBeenLastCalledWith(SCROLL_TO_START);
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(
        screen.getByRole('region', {
          name: new RegExp(`^${EMPTY_STATES_SECTION}`),
        }),
      );
      expect(window.location.hash).toBe(
        voiceSectionHref(VOICE_SECTION.EMPTY_STATES),
      );
    });

    it('jumps from a chip with Enter', async () => {
      chip(ERROR_PAGES_SECTION).focus();
      await user.keyboard('{Enter}');

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveFocus();
    });

    it('fades only the end while more chips lie to the right', () => {
      scrollChipList(0);

      const start = screen.queryByTestId(VOICE_SECTION_BAR_FADE_START_TEST_ID);
      const end = screen.getByTestId(VOICE_SECTION_BAR_FADE_END_TEST_ID);
      expect(start).not.toBeInTheDocument();
      expect(end).toBeInTheDocument();
    });

    it('fades only the start once scrolled to the end', () => {
      scrollChipList(LIST_WIDTH - TRACK_WIDTH);

      const start = screen.getByTestId(VOICE_SECTION_BAR_FADE_START_TEST_ID);
      const end = screen.queryByTestId(VOICE_SECTION_BAR_FADE_END_TEST_ID);
      expect(start).toBeInTheDocument();
      expect(end).not.toBeInTheDocument();
    });
  });

  it('counts customised fields on each chip', () => {
    setupBilingualVoiceSettings();

    const errorPages = within(chip(ERROR_PAGES_SECTION));
    const emptyStates = within(chip(EMPTY_STATES_SECTION));

    expect(errorPages.getByText('2 customised')).toBeInTheDocument();
    expect(emptyStates.getByText('1 customised')).toBeInTheDocument();
  });

  it('publishes the bar height before a first-load hash scrolls to its section', () => {
    window.history.replaceState(null, '', `#${ERRORS_IDS.section}`);
    const heightsAtScroll: string[] = [];
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {
      heightsAtScroll.push(
        document.documentElement.style.getPropertyValue(
          VOICE_BAR_HEIGHT_PROPERTY,
        ),
      );
    });

    setupVoiceSettings();

    expect(heightsAtScroll).toEqual(['0px']);
  });

  it('jumps instantly with reduced motion', async () => {
    stubMatchingMediaQuery(MEDIA_QUERY.REDUCED_MOTION);
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    setupVoiceSettings();

    await user.click(chip(ERROR_PAGES_SECTION));

    expect(scrollIntoView).toHaveBeenLastCalledWith({
      ...SCROLL_TO_START,
      behavior: 'instant',
    });
  });

  describe('with the text buttons shown from 1024', () => {
    describe('and nothing customised', () => {
      beforeEach(() => {
        setupVoiceSettings();
      });

      it('hides the Jump to label from screen readers', () => {
        const label = within(sectionBar()).getByText(VOICE_SETTINGS.jumpTo);

        expect(label).toHaveAttribute(ARIA_HIDDEN, 'true');
      });

      it('orders the chips, then the bar buttons, before the sections', async () => {
        chip(ERROR_PAGES_SECTION).focus();

        await user.tab();
        expect(chip(EMPTY_STATES_SECTION)).toHaveFocus();
        await user.tab();
        expect(barButton(VOICE_SETTINGS.expandAll)).toHaveFocus();
        await user.tab();
        expect(barButton(VOICE_SETTINGS.collapseAll)).toHaveFocus();
        await user.tab();
        expect(barButton(VOICE_SETTINGS.expandAllSections)).toHaveFocus();
        await user.tab();
        expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveFocus();
      });

      it('opens every section with Expand all and closes them with Collapse all', async () => {
        await user.click(barButton(VOICE_SETTINGS.expandAll));
        expectEverySection(true);

        await user.click(barButton(VOICE_SETTINGS.collapseAll));
        expectEverySection(false);
      });

      it.each([VOICE_SETTINGS.expandAll, VOICE_SETTINGS.collapseAll])(
        'lets %s control every section body and stay enabled',
        (name) => {
          const button = barButton(name);

          expect(button).toHaveAttribute(ARIA_CONTROLS, SECTION_BODY_IDS);
          expect(button).toBeEnabled();
        },
      );
    });

    it('keeps the bar operable for an archived tenant', async () => {
      setupVoiceSettings({ archivedAt: MOCK_ARCHIVED_AT });

      await user.click(barButton(VOICE_SETTINGS.expandAll));
      await user.click(chip(ERROR_PAGES_SECTION));

      expect(voiceSectionHeader(EMPTY_STATES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveFocus();
    });
  });

  describe('with the icon button shown below 1024', () => {
    const expandAllSections = () => barButton(VOICE_SETTINGS.expandAllSections);

    it('lets the icon button control every section body', () => {
      setupVoiceSettings();

      expect(expandAllSections()).toHaveAttribute(
        ARIA_CONTROLS,
        SECTION_BODY_IDS,
      );
    });

    it('expands every section, then names itself Collapse all sections and collapses them', async () => {
      setupVoiceSettings();

      await user.click(expandAllSections());
      expectEverySection(true);

      await user.click(barButton(VOICE_SETTINGS.collapseAllSections));
      expectEverySection(false);
      expect(expandAllSections()).toBeInTheDocument();
    });

    it('stays Expand all sections while any section is collapsed', async () => {
      setupVoiceSettings();

      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      expect(expandAllSections()).toBeInTheDocument();
    });

    it('shows its current name as a tooltip at once on keyboard focus', async () => {
      setupVoiceSettings();
      barButton(VOICE_SETTINGS.collapseAll).focus();

      await user.tab();

      const tooltip = await screen.findByText(
        VOICE_SETTINGS.expandAllSections,
        { ignore: 'button' },
      );
      expect(expandAllSections()).toHaveFocus();
      expect(tooltip).toBeVisible();
    });

    it('marks no chip active while the bar is in flow, even past a header', async () => {
      setupVoiceSettings();
      placeHeaders(-BELOW_LINE, -BELOW_LINE);
      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).toHaveAttribute(
          ARIA_CURRENT,
          ACTIVE,
        ),
      );

      const bar = sectionBar();
      placeHeaders(-BELOW_LINE, -BELOW_LINE, {
        element: bar,
        top: IN_FLOW_BAR_TOP,
        bottom: IN_FLOW_BAR_TOP + BAR_HEIGHT,
      });

      await waitFor(() =>
        expect(chip(EMPTY_STATES_SECTION)).not.toHaveAttribute(ARIA_CURRENT),
      );
      expect(chip(ERROR_PAGES_SECTION)).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('keeps the icon button operable for an archived tenant', async () => {
      setupVoiceSettings({ archivedAt: MOCK_ARCHIVED_AT });

      await user.click(expandAllSections());

      expectEverySection(true);
    });
  });
});
