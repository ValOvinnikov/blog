import { customRender, screen } from '@web/testing/custom-render';

import { useActiveHeadingId } from './use-active-heading-id';

type TObserverEntryInit = {
  target: Element;
  isIntersecting: boolean;
  top: number;
};

class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds: number[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve() {}

  disconnect() {
    this.observed = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: TObserverEntryInit[]) {
    const fullEntries = entries.map(
      (entry) =>
        ({
          target: entry.target,
          isIntersecting: entry.isIntersecting,
          boundingClientRect: { top: entry.top } as DOMRectReadOnly,
        }) as IntersectionObserverEntry,
    );
    this.callback(fullEntries, this);
  }
}

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

const getObserver = (): FakeIntersectionObserver => {
  const [observer] = FakeIntersectionObserver.instances;
  if (!observer) {
    throw new Error('Expected an IntersectionObserver instance to exist.');
  }
  return observer;
};

describe(useActiveHeadingId, () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with three headings', () => {
    let observer: FakeIntersectionObserver;

    beforeEach(() => {
      setup({ ids: ['one', 'two', 'three'] });
      observer = getObserver();
    });

    it('returns null before any heading has intersected', () => {
      expect(screen.getByTestId('active-id')).toHaveTextContent('none');
    });

    it('sets the active id to the intersecting heading', () => {
      observer.trigger([
        {
          target: document.getElementById('one')!,
          isIntersecting: true,
          top: 10,
        },
      ]);

      expect(screen.getByTestId('active-id')).toHaveTextContent('one');
    });

    it('picks the topmost heading when multiple are intersecting at once', () => {
      observer.trigger([
        {
          target: document.getElementById('two')!,
          isIntersecting: true,
          top: 50,
        },
        {
          target: document.getElementById('one')!,
          isIntersecting: true,
          top: 5,
        },
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
    const observer = getObserver();

    observer.trigger([
      {
        target: document.getElementById('one')!,
        isIntersecting: false,
        top: 5,
      },
    ]);

    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });
});
