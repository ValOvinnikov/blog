import { customRender, screen } from '@web/testing/custom-render';
import {
  FakeIntersectionObserver,
  getFakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { useActiveHeadingId } from './use-active-heading-id';

const headingEntry = (
  id: string,
  isIntersecting: boolean,
  top: number,
): Partial<IntersectionObserverEntry> => ({
  target: document.getElementById(id)!,
  isIntersecting,
  boundingClientRect: { top } as DOMRectReadOnly,
});

const Harness = ({ ids }: { ids: string[] }) => {
  const activeId = useActiveHeadingId(ids);

  return (
    <div>
      <p data-testid="active-id">{activeId ?? 'none'}</p>
      {ids.map((id) => (
        <h2 key={id} id={id}>
          {id}
        </h2>
      ))}
    </div>
  );
};

const setup = customRender(Harness, { ids: [] });

describe(useActiveHeadingId, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with three headings', () => {
    let observer: FakeIntersectionObserver;

    beforeEach(() => {
      setup({ ids: ['one', 'two', 'three'] });
      observer = getFakeIntersectionObserver();
    });

    it('returns null before any heading has intersected', () => {
      expect(screen.getByTestId('active-id')).toHaveTextContent('none');
    });

    it('sets the active id to the intersecting heading', () => {
      observer.trigger([headingEntry('one', true, 10)]);

      expect(screen.getByTestId('active-id')).toHaveTextContent('one');
    });

    it('picks the topmost heading when multiple are intersecting at once', () => {
      observer.trigger([
        headingEntry('two', true, 50),
        headingEntry('one', true, 5),
      ]);

      expect(screen.getByTestId('active-id')).toHaveTextContent('one');
    });
  });

  it('returns nothing to observe for an empty id list', () => {
    setup({ ids: [] });

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });

  it('ignores non-intersecting entries', () => {
    setup({ ids: ['one', 'two'] });
    const observer = getFakeIntersectionObserver();

    observer.trigger([headingEntry('one', false, 5)]);

    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });
});
