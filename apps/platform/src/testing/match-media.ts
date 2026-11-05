import { act } from '@platform/testing/custom-render';

export const stubLgUpWindow = () => {
  const stubMatchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    matches: true,
  }));
};

export const stubMatchingMediaQuery = (matchingQuery: string) => {
  const stubMatchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    matches: query === matchingQuery,
  }));
};

const globalMatchMedia = window.matchMedia;

export const stubChangingMediaQueries = (initialQueries: readonly string[]) => {
  let matchingQueries = initialQueries;
  const listeners = new Set<EventListener>();
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...globalMatchMedia(query),
    get matches() {
      return matchingQueries.includes(query);
    },
    addEventListener: (_type: string, listener: EventListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: EventListener) => {
      listeners.delete(listener);
    },
  }));

  return (nextQueries: readonly string[]) => {
    matchingQueries = nextQueries;
    act(() => listeners.forEach((listener) => listener(new Event('change'))));
  };
};
