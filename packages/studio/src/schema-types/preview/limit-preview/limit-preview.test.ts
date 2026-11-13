import { BRAND_VARIANT } from '@blog/config/constants';
import { limitPreview } from '@blog/studio/schema-types/preview/limit-preview/limit-preview';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { faker } from '@faker-js/faker';

faker.seed(4117);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });

const { prepare } = limitPreview;

describe(prepare, () => {
  it('subtitles the module with its brand variant and limit', () => {
    const { subtitle } = prepare({
      title: MOCK_TITLE,
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      limit: MOCK_LIMIT,
    });

    expect(subtitle).toBe(
      moduleSubtitle(
        BRAND_VARIANT.BRAND_PRIMARY,
        `Limit: ${String(MOCK_LIMIT)}`,
      ),
    );
  });

  it('leaves the limit out of the subtitle when none is set', () => {
    const { subtitle } = prepare({
      title: MOCK_TITLE,
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    });

    expect(subtitle).toBe(moduleSubtitle(BRAND_VARIANT.BRAND_PRIMARY));
  });
});
