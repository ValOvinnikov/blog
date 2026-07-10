/**
 * Inline dark-mode bootstrap script, run before hydration to avoid a
 * flash of incorrect theme. Kept as a stable string constant (rather than
 * inlined in JSX) so its SHA-256 hash — allow-listed in the CSP `script-src`
 * in `next.config.ts` — stays deterministic across builds.
 */
export const themeBootstrapScript =
  "(function(){try{var s=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})()";
