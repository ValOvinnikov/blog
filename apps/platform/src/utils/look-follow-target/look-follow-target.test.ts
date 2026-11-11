import { LOOK_CARD } from '@platform/constants/look-card';
import { LOOK_FOLLOW_TARGET } from '@platform/constants/look-follow';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { mockOpenRowTarget } from '@platform/testing/look/look-follow';
import { LOOK_ROWS } from '@platform/utils/look-open-rows/look-open-rows';

import { toLookFollowOutline, toLookFollowTarget } from './look-follow-target';

const IDLE = { kind: LOOK_FOLLOW_TARGET.IDLE };

describe(toLookFollowTarget, () => {
  it('waits for a card when every row is folded', () => {
    expect(toLookFollowTarget([], undefined, false)).toEqual(IDLE);
  });

  it('waits for a focused card after Expand all', () => {
    expect(toLookFollowTarget(LOOK_ROWS, undefined, true)).toEqual({
      kind: LOOK_FOLLOW_TARGET.ALL_OPEN,
    });
  });

  it('waits for a card without moving once a row folds after Expand all', () => {
    const partlyOpen = LOOK_ROWS.filter((row) => row !== LOOK_ROW.FOOTER);

    expect(toLookFollowTarget(partlyOpen, undefined, false)).toEqual({
      kind: LOOK_FOLLOW_TARGET.UNEDITED,
    });
  });

  it('follows the focused Site parts card after Expand all', () => {
    expect(toLookFollowTarget(LOOK_ROWS, LOOK_ROW.FOOTER, true)).toEqual({
      kind: LOOK_FOLLOW_TARGET.PART,
      row: LOOK_ROW.FOOTER,
    });
  });

  it('keeps following the open Site parts card while the preset card is focused', () => {
    expect(
      toLookFollowTarget([LOOK_ROW.HEADER], LOOK_CARD.PRESET, false),
    ).toEqual({ kind: LOOK_FOLLOW_TARGET.PART, row: LOOK_ROW.HEADER });
  });

  it('follows an open Style card with nothing to outline for a whole-page card', () => {
    expect(toLookFollowTarget([LOOK_ROW.TYPE], LOOK_ROW.TYPE, false)).toEqual({
      kind: LOOK_FOLLOW_TARGET.STYLE,
      row: LOOK_ROW.TYPE,
      parts: [],
    });
  });
});

describe(toLookFollowOutline, () => {
  const openOnly = (row: TLookRow) =>
    toLookFollowOutline(mockOpenRowTarget(row));

  it('outlines the header for the Language switcher card', () => {
    expect(openOnly(LOOK_ROW.LANGUAGE_SWITCHER)).toEqual({
      row: LOOK_ROW.LANGUAGE_SWITCHER,
      parts: [SAMPLE_PART.HEADER],
    });
  });

  it.each([LOOK_ROW.COLOUR, LOOK_ROW.TYPE])(
    'outlines nothing for %s, which changes the whole page',
    (row) => {
      expect(openOnly(row)).toBeUndefined();
    },
  );

  it('outlines the post images for Corners & spacing but not for Cards', () => {
    expect(openOnly(LOOK_ROW.SHAPE)?.parts).toContain(SAMPLE_PART.POST_IMAGE);
    expect(openOnly(LOOK_ROW.CARDS)?.parts).not.toContain(
      SAMPLE_PART.POST_IMAGE,
    );
  });

  it('outlines nothing while nothing is followed', () => {
    expect(toLookFollowOutline(IDLE)).toBeUndefined();
  });
});
