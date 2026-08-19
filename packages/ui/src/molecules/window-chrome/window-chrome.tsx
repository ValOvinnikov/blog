import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { WindowChromeBar } from './components/bar/window-chrome-bar';
import { WindowChromeBody } from './components/body/window-chrome-body';
import { WindowChromePrompt } from './components/prompt/window-chrome-prompt';
import { WindowChromeTag } from './components/tag/window-chrome-tag';
import { WindowChromeUser } from './components/user/window-chrome-user';
import { windowChromeVariants } from './window-chrome-variants';

const WindowChromeSlotParts = {
  Bar: WindowChromeBar,
  Body: WindowChromeBody,
} satisfies Record<string, ElementType>;

const WindowChromeParts = {
  ...WindowChromeSlotParts,
  User: WindowChromeUser,
  Prompt: WindowChromePrompt,
  Tag: WindowChromeTag,
} satisfies Record<string, ElementType>;

export type TWindowChromeProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<typeof WindowChromeSlotParts>;
  };

/**
 * WindowChrome — the reusable terminal-window shell (a bordered, rounded
 * surface with a prompt-styled title bar above a padded body) shared by
 * every engagement feature — auth, comments, ratings, bookmarks, newsletter —
 * so each one reads as part of the same console idiom instead of inventing
 * its own card treatment. Composes `WindowChrome.Bar` (built from
 * `WindowChrome.User`/`WindowChrome.Prompt` prompt segments and an optional
 * `WindowChrome.Tag` pill) and `WindowChrome.Body`.
 */
const WindowChromeRoot = ({
  children,
  className,
  dataTestId,
}: TWindowChromeProps) => {
  const { slots, unmatched } = mapCompoundSlots(
    children,
    WindowChromeSlotParts,
  );

  return (
    <div
      className={windowChromeVariants({ class: className })}
      data-testid={dataTestId}
    >
      {slots.Bar}
      {slots.Body}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

export const WindowChrome: TCompoundComponent<
  typeof WindowChromeRoot,
  typeof WindowChromeParts
> = Object.assign(WindowChromeRoot, WindowChromeParts);
