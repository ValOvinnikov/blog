import { okResult } from '@shinefold/utils';
import { screen } from '@web/testing/custom-render';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import type { Mock } from 'vitest';

interface IEmptyPostListContractOptions<TData> {
  pageLoaderMock: Mock;
  postListMock: Mock;
  setup: TAsyncSetup;
  successData: TData;
  emptyState: string;
}

export const testNamesTermInEmptyPostList = <TData extends object>({
  pageLoaderMock,
  postListMock,
  setup,
  successData,
  emptyState,
}: IEmptyPostListContractOptions<TData>) => {
  it('names the term in an empty post list', async () => {
    pageLoaderMock.mockResolvedValue(
      okResult({
        ...successData,
        modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
      }),
    );
    postListMock.mockResolvedValueOnce(okResult(mockPostListModuleData()));

    await setup();

    const emptyStateText = screen.getByText(emptyState);

    expect(emptyStateText).toBeVisible();
  });
};
