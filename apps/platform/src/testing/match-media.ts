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
