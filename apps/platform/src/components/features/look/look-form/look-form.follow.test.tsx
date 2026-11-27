import { LOOK_FOLLOW_TEST_ID } from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  followLine,
  followStatusText,
  stubMeasuredDesktopSample,
} from '@platform/testing/look/look-follow';
import {
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { toggleAllButton } from '@platform/testing/look/look-jump-index';
import { stubLgUpWindow } from '@platform/testing/match-media';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM, lookFollow: LOOK_FOLLOW } = messages;

const outline = () => screen.queryByTestId(LOOK_FOLLOW_TEST_ID.OUTLINE);

describe(`<${LookForm.name}/> follow`, () => {
  let user: UserEvent;
  let restoreMeasuredSample: () => void;

  beforeEach(() => {
    user = userEvent.setup();
    stubLgUpWindow();
    restoreMeasuredSample = stubMeasuredDesktopSample();
    setupLookForm();
  });

  afterEach(() => {
    restoreMeasuredSample();
    vi.restoreAllMocks();
  });

  it('waits for the Header or Footer card on first load', () => {
    expect(followStatusText()).toBe(LOOK_FOLLOW.idle);
    expect(outline()).not.toBeInTheDocument();
  });

  it('outlines the part of the opened Footer card', async () => {
    await openLookRow(user, LOOK_ROW.FOOTER);

    expect(outline()).toHaveTextContent(LOOK_FORM.footerHeading);
  });

  it('outlines the busy button and breadcrumb row under the Small details name', async () => {
    await openLookRow(user, LOOK_ROW.DETAILS);

    const tag = screen.getByTestId(LOOK_FOLLOW_TEST_ID.TAG);

    expect(tag).toHaveTextContent(LOOK_FORM.detailsHeading);
  });

  it('outlines what an opened card changes under its name', async () => {
    await openLookRow(user, LOOK_ROW.SHAPE);

    const tag = screen.getByTestId(LOOK_FOLLOW_TEST_ID.TAG);
    const line = followLine('styleOutlined', { card: LOOK_FORM.shapeHeading });

    expect(followStatusText()).toBe(line);
    expect(tag).toHaveTextContent(LOOK_FORM.shapeHeading);
  });

  it('holds the frame still for a whole-page card', async () => {
    await openLookRow(user, LOOK_ROW.TYPE);

    const line = followLine('styleCard', { card: LOOK_FORM.typeHeading });

    expect(followStatusText()).toBe(line);
    expect(outline()).not.toBeInTheDocument();
  });

  it('asks for a Site parts card without outlining once a row folds after Expand all', async () => {
    await user.click(toggleAllButton(LOOK_FORM.expandAll));

    await user.click(lookRowTrigger(LOOK_ROW.HEADER));

    expect(followStatusText()).toBe(LOOK_FOLLOW.idle);
    expect(outline()).not.toBeInTheDocument();
  });
});
