import { screen } from '@web/testing/custom-render';

import {
  MOCK_CHILDREN_STUB_TEST_ID,
  MOCK_CTA_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_POST_LIST_STUB_TEST_ID,
  mockModule,
} from './fixtures';
import { getStubTestIds, type IWithSetup } from './module-renderer-contract';

export const testChildrenInsideFirstPostList = ({ setup }: IWithSetup) => {
  it('renders the given children inside the first Post List module only', async () => {
    const [firstPostList, secondPostList] = [
      mockModule('module_postList'),
      mockModule('module_postList'),
    ];

    await setup({
      hero: mockModule('module_heroBlog'),
      modules: [mockModule('module_cta'), firstPostList, secondPostList],
      children: <div data-testid={MOCK_CHILDREN_STUB_TEST_ID} />,
    });

    const children = screen.getByTestId(MOCK_CHILDREN_STUB_TEST_ID);
    const [firstPostListStub, secondPostListStub] = screen.getAllByTestId(
      MOCK_POST_LIST_STUB_TEST_ID,
    );

    expect(firstPostListStub).toContainElement(children);
    expect(secondPostListStub).not.toContainElement(children);
  });
};

export const testChildrenBetweenHeroAndModulesWithoutPostList = ({
  setup,
}: IWithSetup) => {
  it('renders the given children between the hero and the modules when there is no Post List', async () => {
    await setup({
      hero: mockModule('module_heroBlog'),
      modules: [mockModule('module_cta')],
      children: <div data-testid={MOCK_CHILDREN_STUB_TEST_ID} />,
    });

    const stubTestIds = getStubTestIds();

    expect(stubTestIds).toEqual([
      MOCK_HERO_STUB_TEST_ID,
      MOCK_CHILDREN_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
    ]);
  });
};
