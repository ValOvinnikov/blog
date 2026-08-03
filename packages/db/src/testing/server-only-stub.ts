// No-op stand-in for the `server-only` guard used only in the Vitest (node)
// environment. `server-only` resolves to a module that throws unless loaded
// under the bundler's `react-server` condition (which Next provides in RSC but
// Vitest does not), so client.ts's `import 'server-only'` would otherwise fail
// the suite. The real guard still applies in the app build.
export {};
