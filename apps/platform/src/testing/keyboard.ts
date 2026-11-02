import { KEY } from '@platform/constants/keyboard';

export const USER_EVENT_KEY = {
  ARROW_LEFT: `{${KEY.ARROW_LEFT}}`,
  ARROW_RIGHT: `{${KEY.ARROW_RIGHT}}`,
  HOME: `{${KEY.HOME}}`,
  END: `{${KEY.END}}`,
  ENTER: `{${KEY.ENTER}}`,
  SPACE: KEY.SPACE,
} as const;
