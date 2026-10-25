import { customRender, screen } from '@web/testing/custom-render';
import {
  FakeIntersectionObserver,
  getFakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { useActiveHeadingId } from './use-active-heading-id';

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
      setup({ ids: ['one', 'two', 'three'] });
    });

    it('has no active heading before any heading has intersected', () => {
      const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

      expect(activeId).toHaveTextContent(NO_ACTIVE_ID);
    });

    it.each([
      {
        title: 'marks the intersecting heading active',
        entries: () => [headingEntry('one', true, 10)],
        expected: 'one',
      },
      {
        title: 'marks the topmost of several intersecting headings active',
        entries: () => [
          headingEntry('two', true, 50),
          headingEntry('one', true, 5),
        ],
        expected: 'one',
      },
      {
        title: 'ignores a heading that is not intersecting',
        entries: () => [headingEntry('one', false, 5)],
        expected: NO_ACTIVE_ID,
      },
    ])('$title', ({ entries, expected }) => {
      getFakeIntersectionObserver().trigger(entries());

      const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

      expect(activeId).toHaveTextContent(expected);
    });
  });

  it('observes nothing for an empty id list', () => {
    setup({ ids: [] });

    const activeId = screen.getByTestId(ACTIVE_ID_TEST_ID);

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(activeId).toHaveTextContent(NO_ACTIVE_ID);
  });
});
