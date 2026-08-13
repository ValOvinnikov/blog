// No-op stand-in for the `server-only` guard used only in the Vitest test
// environment. `server-only` throws unless loaded under the bundler's
// `react-server` condition, which Vitest doesn't provide — the real guard
// still applies in the app build.
export {};
