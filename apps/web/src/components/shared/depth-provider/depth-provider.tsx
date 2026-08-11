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
  useSyncExternalStore,
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

// `useSyncExternalStore`'s server/client snapshot pair, used here purely to
// ask React "is the render happening right now genuinely matching
// pre-rendered server HTML?" — there is no store to subscribe to, so
// `subscribeToNothing` is a no-op. React calls `getBootstrapScriptServerSnapshot`
// on the server, *and*, on the client, for the one render that must match the
// server-rendered DOM (its internal hydration flag); every other client
// render — including a plain client-side mount with no server-rendered DOM to
// hydrate against, e.g. an App Router client-side navigation into this route
// segment for the first time in the tab — calls `getBootstrapScriptClientSnapshot`
// instead, from its very first render. A ref-based "is this my first render"
// guard can't see that distinction: a ref starts out identically on *any*
// first render, hydrating or not. `getBootstrapScriptClientSnapshot` is a
// hard-coded `false` because a client-side render of the bootstrap `<script>`
// is inert anyway — React never executes a `<script>` tag it creates outside
// an actual HTML parse — so nothing is lost by never rendering it there,
// while `getBootstrapScriptServerSnapshot` (`true`) keeps the script present
// for the server markup and the matching hydration render, letting the
// browser's HTML parser run it before React hydrates.
function subscribeToNothing() {
  return () => {};
}
function getBootstrapScriptClientSnapshot() {
  return false;
}
function getBootstrapScriptServerSnapshot() {
  return true;
}

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
 * `useSyncExternalStore` (see the snapshot pair above) gates the bootstrap
 * script so it renders only for the render that's genuinely hydrating
 * server-rendered HTML — never for a plain client-side mount (no matching
 * server DOM), nor for a later client-only re-render of the same instance
 * (e.g. the `hasSkim`/`hasDeep` change above). After a real hydration match,
 * React re-checks the snapshot post-commit, finds it now disagrees
 * (`getBootstrapScriptClientSnapshot` is always `false`), and schedules one
 * more render that omits the script — the same "renders once, through
 * mount, then never again" lifecycle the previous ref-based guard had, but
 * one that also skips the script entirely on a mount React was never going
 * to hydrate in the first place, instead of rendering it there only to have
 * React log a "Scripts inside React components are never executed when
 * rendering on the client" warning about it.
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
  const shouldRenderBootstrapScript = useSyncExternalStore(
    subscribeToNothing,
    getBootstrapScriptClientSnapshot,
    getBootstrapScriptServerSnapshot,
  );

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
      <div
        className={s.root()}
        data-depth={depth}
        suppressHydrationWarning={true}
      >
        {shouldRenderBootstrapScript && (
          <script
            dangerouslySetInnerHTML={{
              __html: buildDepthBootstrapScript({ hasSkim, hasDeep }),
            }}
          />
        )}
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
