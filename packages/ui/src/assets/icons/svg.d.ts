// SVGR (bundler config lives in each consumer: Next.js/Turbopack rules,
// Storybook's viteFinal, and the Vitest preset) turns a bare `.svg` import
// into a React component; the `?url` suffix bypasses SVGR and resolves to
// the emitted asset's URL instead. See docs/design-reference/icons/README.md
// for the source SVGs these types back.
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';

  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
