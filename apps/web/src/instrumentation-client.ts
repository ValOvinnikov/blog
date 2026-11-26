import { HTTP_METHOD } from '@shinefold/config/constants';
import { initBotId } from 'botid/client/core';

// A server action posts to the URL of the page it runs on, and a module can sit on any page.
initBotId({
  protect: [{ path: '/*', method: HTTP_METHOD.POST }],
});
