import { faker } from '@faker-js/faker';
import { customRender } from '@web/testing/custom-render';

import { useHeightCssVariable } from './use-height-css-variable';

faker.seed(6012);

const MOCK_HEIGHT_PX = faker.number.int({ min: 40, max: 200 });
const MOCK_VARIABLE_NAME = `--${faker.lorem.word()}-height` as const;

const Harness = () => {
  const ref = useHeightCssVariable<HTMLDivElement>(MOCK_VARIABLE_NAME);

  return <div ref={ref} />;
};

const setup = customRender(Harness, {});

describe(useHeightCssVariable, () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => DOMRect.fromRect({ height: MOCK_HEIGHT_PX }),
    );
    vi.stubGlobal(
      'ResizeObserver',
      class implements ResizeObserver {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this);
        }
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sets the variable to the element height on the root element', () => {
    setup();

    const value =
      document.documentElement.style.getPropertyValue(MOCK_VARIABLE_NAME);
    expect(value).toBe(`${MOCK_HEIGHT_PX}px`);
  });

  it('removes the variable on unmount', () => {
    const { unmount } = setup();

    unmount();

    const value =
      document.documentElement.style.getPropertyValue(MOCK_VARIABLE_NAME);
    expect(value).toBe('');
  });
});
