import { defineMigration, del } from 'sanity/migrate';

const SETTINGS_VOICE_TYPE = 'settings_voice';

export default defineMigration({
  title: 'Delete orphaned settings_voice documents',
  documentTypes: [SETTINGS_VOICE_TYPE],
  migrate: {
    document(doc) {
      return [del(doc._id)];
    },
  },
});
