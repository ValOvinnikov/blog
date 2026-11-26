import { stubResizeObserver } from '@platform/testing/resize-observer';

const MOCK_LIST_SIZE = { width: 480, height: 80 };
const MOCK_FIRST_ROW_TOP = 0;
const MOCK_WRAPPED_ROW_TOP = 120;

export const stubFirstRowTileCount = (firstRowCount: number) => {
  stubResizeObserver(() => MOCK_LIST_SIZE);

  vi.spyOn(HTMLLIElement.prototype, 'getBoundingClientRect').mockImplementation(
    function mockTileRect(this: HTMLLIElement) {
      const tiles = Array.from(this.parentElement?.children ?? []);
      const top =
        tiles.indexOf(this) < firstRowCount
          ? MOCK_FIRST_ROW_TOP
          : MOCK_WRAPPED_ROW_TOP;

      return new DOMRect(0, top, 0, 0);
    },
  );
};
