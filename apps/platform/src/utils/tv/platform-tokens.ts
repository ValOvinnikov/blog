export const platformTokens = (...suffixes: string[]) =>
  suffixes.map((suffix) => `platform-${suffix}`);
