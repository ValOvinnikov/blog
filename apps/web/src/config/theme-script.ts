export const THEME_STORAGE_KEY = 'theme';

export const themeBootstrapScript = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})()`;
