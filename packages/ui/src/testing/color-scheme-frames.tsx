import { COLOR_SCHEME } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

// A story that injects page-wide CSS must not render inline on its docs page, or it repaints the stories beside it.
export const IN_OWN_IFRAME = { docs: { story: { inline: false } } };

export const ColorSchemeFrames = ({
  css,
  children,
}: IWithChildren & { css: string }) => (
  <div className="flex flex-col gap-6">
    <style>{css}</style>
    {Object.values(COLOR_SCHEME).map((scheme) => (
      <div
        key={scheme}
        className={scheme === COLOR_SCHEME.DARK ? 'dark' : undefined}
      >
        {children}
      </div>
    ))}
  </div>
);
