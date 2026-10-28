import { MODULE_PACK } from '@blog/config/constants';
import { entitledModuleFilter } from '@blog/studio/schema-types/filters/entitled-module';
import {
  EVERY_MODULE_PACK,
  setEntitledModulePacks,
} from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import { evaluate, parse } from 'groq-js';

faker.seed(5048);

const MOCK_CTA_ID = faker.string.uuid();
const MOCK_PRICING_ID = faker.string.uuid();
const DATASET = [
  mockDocument({ _id: MOCK_CTA_ID, _type: 'module_cta' }),
  mockDocument({ _id: MOCK_PRICING_ID, _type: 'module_pricing' }),
];

const offeredModules = async () => {
  const { filter, params } = entitledModuleFilter();
  const query = `*[${filter}] | order(_id asc)._id`;
  const result = await evaluate(parse(query, { params }), {
    dataset: DATASET,
    params,
  });

  return result.get();
};

describe(entitledModuleFilter, () => {
  afterEach(() => {
    setEntitledModulePacks(EVERY_MODULE_PACK);
  });

  it('offers only modules inside the entitled packs', async () => {
    setEntitledModulePacks([MODULE_PACK.CORE]);

    expect(await offeredModules()).toEqual([MOCK_CTA_ID]);
  });

  it('offers every module when every pack is entitled', async () => {
    expect(await offeredModules()).toEqual(
      [MOCK_CTA_ID, MOCK_PRICING_ID].sort(),
    );
  });
});
