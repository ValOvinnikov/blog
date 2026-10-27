import { HEADER_CONTROL_STYLE, type THeaderControlStyle } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toDraftOffer } from './settings-draft-offer';

type TValues = {
  name: string;
  tagline?: string;
  style: THeaderControlStyle;
};

faker.seed(6006);

const MOCK_SAVED_NAME = faker.company.name();
const MOCK_DRAFT_NAME = faker.company.name();
const MOCK_NO_TAGLINE = faker.lorem.word();
const MOCK_TAKEN_AT = faker.date
  .past({ refDate: '2026-10-19T10:00:00.000Z' })
  .toISOString();

const NAME_FIELD = {
  id: 'name',
  label: 'Name',
  display: ({ name }: TValues) => name,
};
const TAGLINE_FIELD = {
  id: 'tagline',
  label: 'Tagline',
  display: ({ tagline }: TValues) => tagline ?? MOCK_NO_TAGLINE,
};
const STYLE_FIELD = {
  id: 'style',
  label: 'Style',
  display: ({ style }: TValues) => style,
};
const FIELDS = [NAME_FIELD, TAGLINE_FIELD, STYLE_FIELD];

const SAVED: TValues = {
  name: MOCK_SAVED_NAME,
  tagline: undefined,
  style: HEADER_CONTROL_STYLE.SOFT,
};

describe(toDraftOffer, () => {
  it('offers a draft missing only keys the saved values leave unset', () => {
    const draftValues = { name: MOCK_DRAFT_NAME, style: SAVED.style };

    const offer = toDraftOffer(
      {
        values: draftValues,
        baseline: { name: SAVED.name, style: SAVED.style },
        takenAt: MOCK_TAKEN_AT,
      },
      SAVED,
      FIELDS,
    );

    expect(offer).toEqual({
      values: draftValues,
      takenAt: new Date(MOCK_TAKEN_AT),
      changeCount: 1,
      differences: [],
    });
  });

  it('drops a draft written before a field the saved values now hold', () => {
    const offer = toDraftOffer(
      {
        values: { name: MOCK_DRAFT_NAME },
        baseline: { name: SAVED.name },
        takenAt: MOCK_TAKEN_AT,
      },
      SAVED,
      FIELDS,
    );

    expect(offer).toBeNull();
  });

  it('drops a draft that matches the saved values', () => {
    const offer = toDraftOffer(
      { values: SAVED, baseline: SAVED, takenAt: MOCK_TAKEN_AT },
      SAVED,
      FIELDS,
    );

    expect(offer).toBeNull();
  });

  it('lists a field saved again since the draft was taken', () => {
    const draftValues = { name: SAVED.name, style: HEADER_CONTROL_STYLE.PLAIN };

    const offer = toDraftOffer(
      { values: draftValues, baseline: draftValues, takenAt: MOCK_TAKEN_AT },
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
