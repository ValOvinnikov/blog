import {
  SIGNED_IN_HINT_ATTRIBUTE,
  SIGNED_IN_HINT_COOKIE_NAME,
} from '@web/utils/signed-in-hint-cookie';

/** Runs before first paint so the header's account slot can take the width of the reader's last known sign-in state. */
export const signedInHintBootstrapScript = `(function(){if(document.cookie.split('; ').some(function(c){return c.indexOf('${SIGNED_IN_HINT_COOKIE_NAME}=1')===0})){document.documentElement.setAttribute('${SIGNED_IN_HINT_ATTRIBUTE}','')}})()`;
