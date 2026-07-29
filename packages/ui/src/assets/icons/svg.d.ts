// SVGR (bundler config lives in each consumer: Next.js/Turbopack rules,
// Storybook's viteFinal, and the Vitest preset) turns a bare `.svg` import
// into a React component; the `?url` suffix bypasses SVGR and resolves to
// the emitted asset's URL instead. These SVGs are self-contained under
// packages/ui/src/assets/icons/ — see the `ICONS` registry (`@blog/config`)
// and the Icon component's Storybook gallery for what each icon is/maps to.
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';

  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
