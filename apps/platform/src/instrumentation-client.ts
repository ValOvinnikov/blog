import { HTTP_METHOD } from '@blog/config';
import { adminRoutes } from '@platform/utils/routes/routes';
import { initBotId } from 'botid/client/core';

// A server action posts to the URL of the page it runs on.
initBotId({
  protect: [{ path: adminRoutes.signUp(), method: HTTP_METHOD.POST }],
});
