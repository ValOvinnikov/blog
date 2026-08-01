'use client';

import { DEPTH, type TDepth } from '@blog/config';
import {
  buildDepthBootstrapScript,
  DEPTH_STORAGE_KEY,
  readStoredDepth,
  type IDepthAvailability,
} from '@web/config/depth-script';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { depthProviderVariants } from './depth-provider-variants';

export interface IDepthContextValue {
  depth: TDepth;
  setDepth: (depth: TDepth) => void;
}

const DepthContext = createContext<IDepthContextValue | undefined>(undefined);

export interface IDepthProviderProps extends IDepthAvailability {
  children: ReactNode;
}

const s = depthProviderVariants();

/**
 * DepthProvider — owns the reader's chosen article depth (30s skim / read /
 * deep dive) for the wrapped subtree. `hasSkim`/`hasDeep` describe what
 * *this* post supports (the same booleans passed to `DepthToggle`) — a
 * depth persisted in `localStorage` from a different post is only honored
 * if it's still valid here; otherwise both the pre-hydration script and the
 * mount effect below fall back to `READ`, so a reader can never land on a
 * post with, say, `SKIM` stamped but no skim to show and no toggle option
 * to get back (`readStoredDepth`/`buildDepthBootstrapScript` in
 * `@web/config/depth-script` own that clamping rule; both call it, so the
 * pre- and post-hydration outcomes always agree).
 *
 * The pre-hydration inline script (`buildDepthBootstrapScript`, built fresh
 * per render from this post's availability) reads the persisted choice and
 * stamps `data-depth` on the wrapper `<div>` directly, before React
 * hydrates, so a returning `SKIM`/`DEEP` reader never sees a flash of the
 * default `READ` view — the same no-flash *mechanism* `themeBootstrapScript`
 * uses, though unlike it this script's content varies per post (not a
 * static constant), since availability does. `suppressHydrationWarning`
 * lets React adopt whatever the script already wrote instead of reverting
 * it to match the server-rendered default. The mount effect re-derives
 * React state by reading `localStorage` directly (not the DOM attribute the
 * script wrote, unlike `ThemeToggleButton` — that component reads the DOM
 * because dark mode has a `prefers-color-scheme` fallback with no
 * `localStorage` entry to re-read; depth has no such fallback, so reading
 * the same source the script did is simpler and equivalent here). Re-runs
 * whenever `hasSkim`/`hasDeep` change — e.g. a client-side navigation to a
 * different post that doesn't remount this component — so a depth that was
 * valid on the previous post gets re-clamped for the new one.
 *
 * @example
 * <DepthProvider hasSkim={Boolean(post.skim)} hasDeep={post.hasAsides}>
 *   <DepthToggle hasSkim={Boolean(post.skim)} hasDeep={post.hasAsides} labels={labels} />
 *   <Article>...</Article>
 * </DepthProvider>
 */
export const DepthProvider = ({
  children,
  hasSkim,
  hasDeep,
}: IDepthProviderProps) => {
  const [depth, setDepthState] = useState<TDepth>(DEPTH.READ);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDepthState(readStoredDepth({ hasSkim, hasDeep }));
  }, [hasSkim, hasDeep]);

  const setDepth = (next: TDepth) => {
    try {
      localStorage.setItem(DEPTH_STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private browsing; state still updates.
    }
    setDepthState(next);
  };

  return (
    <DepthContext.Provider value={{ depth, setDepth }}>
      <div className={s.root()} data-depth={depth} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: buildDepthBootstrapScript({ hasSkim, hasDeep }),
          }}
        />
        {children}
      </div>
    </DepthContext.Provider>
  );
};

/** Reads the current reading depth and its setter — throws outside a `DepthProvider`. */
export function useDepth(): IDepthContextValue {
  const context = useContext(DepthContext);
  if (!context) {
    throw new Error('useDepth must be used within a DepthProvider');
  }
  return context;
}
