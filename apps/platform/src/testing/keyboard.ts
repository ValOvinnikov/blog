import { KEY } from '@platform/constants/keyboard';

export const USER_EVENT_KEY = {
  ARROW_LEFT: `{${KEY.ARROW_LEFT}}`,
  ARROW_RIGHT: `{${KEY.ARROW_RIGHT}}`,
  ARROW_DOWN: `{${KEY.ARROW_DOWN}}`,
  ARROW_UP: `{${KEY.ARROW_UP}}`,
  HOME: `{${KEY.HOME}}`,
  END: `{${KEY.END}}`,
  ENTER: `{${KEY.ENTER}}`,
  SPACE: KEY.SPACE,
  TAB: `{${KEY.TAB}}`,
  ESCAPE: `{${KEY.ESCAPE}}`,
  CONTROL_S: '{Control>}s{/Control}',
} as const;
