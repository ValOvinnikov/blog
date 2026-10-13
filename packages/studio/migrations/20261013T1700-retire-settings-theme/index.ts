import { defineMigration, del } from 'sanity/migrate';

const SETTINGS_THEME_TYPE = 'settings_theme';

export default defineMigration({
  title: 'Retire Theme settings: delete every settings_theme document',
  documentTypes: [SETTINGS_THEME_TYPE],
  migrate: {
    document(doc) {
      return [del(doc._id)];
    },
  },
});
