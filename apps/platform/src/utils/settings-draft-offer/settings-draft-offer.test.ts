import { toDraftOffer } from './settings-draft-offer';

type TValues = { name: string; tagline?: string; style: string };

const FIELDS = [
  { id: 'name', label: 'Name', display: ({ name }: TValues) => name },
  {
    id: 'tagline',
    label: 'Tagline',
    display: ({ tagline }: TValues) => tagline ?? 'none',
  },
  { id: 'style', label: 'Style', display: ({ style }: TValues) => style },
];

const SAVED: TValues = { name: 'Acme', tagline: undefined, style: 'SOFT' };
const TAKEN_AT = '2026-10-19T10:00:00.000Z';

describe(toDraftOffer, () => {
  it('offers a draft whose only missing keys are ones the saved values leave unset', () => {
    const offer = toDraftOffer(
      {
        values: { name: 'Acme Ltd', style: 'SOFT' },
        baseline: { name: 'Acme', style: 'SOFT' },
        takenAt: TAKEN_AT,
      },
      SAVED,
      FIELDS,
    );

    expect(offer).toEqual({
      values: { name: 'Acme Ltd', style: 'SOFT' },
      takenAt: new Date(TAKEN_AT),
      changeCount: 1,
      differences: [],
    });
  });

  it('drops a draft written before a field the saved values now hold', () => {
    expect(
      toDraftOffer(
        {
          values: { name: 'Acme Ltd' },
          baseline: { name: 'Acme' },
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
    const offer = toDraftOffer(
      {
        values: { name: 'Acme', style: 'PLAIN' },
        baseline: { name: 'Acme', style: 'PLAIN' },
        takenAt: TAKEN_AT,
      },
      SAVED,
      FIELDS,
    );

    expect(offer?.differences).toEqual([
      { id: 'style', label: 'Style', saved: 'SOFT', draft: 'PLAIN' },
    ]);
  });
});
