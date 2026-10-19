import { HEADER_CONTROL_STYLE, type THeaderControlStyle } from '@blog/config';

import { toDraftOffer } from './settings-draft-offer';

type TValues = {
  name: string;
  tagline?: string;
  style: THeaderControlStyle;
};

const SAVED_NAME = 'Acme';
const DRAFT_NAME = 'Acme Ltd';
const NO_TAGLINE = 'none';
const TAKEN_AT = '2026-10-19T10:00:00.000Z';

const NAME_FIELD = {
  id: 'name',
  label: 'Name',
  display: ({ name }: TValues) => name,
};
const TAGLINE_FIELD = {
  id: 'tagline',
  label: 'Tagline',
  display: ({ tagline }: TValues) => tagline ?? NO_TAGLINE,
};
const STYLE_FIELD = {
  id: 'style',
  label: 'Style',
  display: ({ style }: TValues) => style,
};
const FIELDS = [NAME_FIELD, TAGLINE_FIELD, STYLE_FIELD];

const SAVED: TValues = {
  name: SAVED_NAME,
  tagline: undefined,
  style: HEADER_CONTROL_STYLE.SOFT,
};

describe(toDraftOffer, () => {
  it('offers a draft whose only missing keys are ones the saved values leave unset', () => {
    const draftValues = { name: DRAFT_NAME, style: SAVED.style };

    const offer = toDraftOffer(
      {
        values: draftValues,
        baseline: { name: SAVED.name, style: SAVED.style },
        takenAt: TAKEN_AT,
      },
      SAVED,
      FIELDS,
    );

    expect(offer).toEqual({
      values: draftValues,
      takenAt: new Date(TAKEN_AT),
      changeCount: 1,
      differences: [],
    });
  });

  it('drops a draft written before a field the saved values now hold', () => {
    expect(
      toDraftOffer(
        {
          values: { name: DRAFT_NAME },
          baseline: { name: SAVED.name },
          takenAt: TAKEN_AT,
        },
        SAVED,
        FIELDS,
      ),
    ).toBeNull();
  });

  it('drops a draft that matches the saved values', () => {
    expect(
      toDraftOffer(
        { values: SAVED, baseline: SAVED, takenAt: TAKEN_AT },
        SAVED,
        FIELDS,
      ),
    ).toBeNull();
  });

  it('lists a field saved again since the draft was taken', () => {
    const draftValues = { name: SAVED.name, style: HEADER_CONTROL_STYLE.PLAIN };

    const offer = toDraftOffer(
      { values: draftValues, baseline: draftValues, takenAt: TAKEN_AT },
      SAVED,
      FIELDS,
    );

    expect(offer?.differences).toEqual([
      {
        id: STYLE_FIELD.id,
        label: STYLE_FIELD.label,
        saved: SAVED.style,
        draft: draftValues.style,
      },
    ]);
  });
});
