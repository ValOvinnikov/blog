import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  FakeIntersectionObserver,
  getFakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { useActiveHeadingId } from './use-active-heading-id';

faker.seed(6012);

const MOCK_FIRST_ID = 'a' + faker.string.alpha(8);
const MOCK_SECOND_ID = 'b' + faker.string.alpha(8);
const MOCK_THIRD_ID = 'c' + faker.string.alpha(8);
const MOCK_HEADING_IDS = [MOCK_FIRST_ID, MOCK_SECOND_ID, MOCK_THIRD_ID];

const ACTIVE_ID_TEST_ID = 'active-id';
const NO_ACTIVE_ID = 'none';

const Harness = ({ ids }: { ids: string[] }) => {
  const activeId = useActiveHeadingId(ids);

  return (
    <div>
      <p data-testid={ACTIVE_ID_TEST_ID}>{activeId ?? NO_ACTIVE_ID}</p>
      {ids.map((id) => (
        <h2 key={id} id={id}>
          {id}
        </h2>
      ))}
    </div>
  );
};

const setup = customRender(Harness, { ids: [] });

const headingEntry = (
  id: string,
  isIntersecting: boolean,
  top: number,
): Partial<IntersectionObserverEntry> => ({
  target: screen.getByRole('heading', { name: id }),
  isIntersecting,
  boundingClientRect: { top } as DOMRectReadOnly,
});

describe(useActiveHeadingId, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with three headings', () => {
    beforeEach(() => {
      setup({ ids: MOCK_HEADING_IDS });
    });

    it('has no active heading before any heading has intersected', () => {
      const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

      expect(activeId).toHaveTextContent(NO_ACTIVE_ID);
    });

    it.each([
      {
        title: 'marks the intersecting heading active',
        entries: () => [headingEntry(MOCK_FIRST_ID, true, 10)],
        expected: MOCK_FIRST_ID,
      },
      {
        title: 'marks the topmost of several intersecting headings active',
        entries: () => [
          headingEntry(MOCK_SECOND_ID, true, 50),
          headingEntry(MOCK_FIRST_ID, true, 5),
        ],
        expected: MOCK_FIRST_ID,
      },
      {
        title: 'ignores a heading that is not intersecting',
        entries: () => [headingEntry(MOCK_FIRST_ID, false, 5)],
        expected: NO_ACTIVE_ID,
      },
    ])('$title', ({ entries, expected }) => {
      getFakeIntersectionObserver().trigger(entries());

      const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

      expect(activeId).toHaveTextContent(expected);
    });
  });

  it('observes nothing for an empty id list', () => {
    setup();

    const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(activeId).toHaveTextContent(NO_ACTIVE_ID);
  });
});
