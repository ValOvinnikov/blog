import { at, createIfNotExists, set } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const childPages = {
  ...baseDoc,
  _id: 'abc123',
  _type: 'module_childPages',
  title: 'Section pages',
  brandVariant: 'PRIMARY',
  headingBlock: { _type: 'moduleHeadingBlock', heading: 'In this section' },
  alignment: 'CENTER',
  layout: { _type: 'wideLayout', spacing: 'DEFAULT' },
};

describe('create-module-section-pages-from-child-pages migration', () => {
  describe('module_childPages documents', () => {
    it('creates a module_sectionPages carrying every field across', () => {
      expect(migration.migrate.document(childPages)).toEqual([
        createIfNotExists({
          _id: 'sectionPages-abc123',
          _type: 'module_sectionPages',
          title: childPages.title,
          brandVariant: childPages.brandVariant,
          headingBlock: childPages.headingBlock,
          alignment: childPages.alignment,
          layout: childPages.layout,
        }),
      ]);
    });

    it('lands a draft module_childPages on the draft module_sectionPages', () => {
      const [mutation] = migration.migrate.document({
        ...childPages,
        _id: 'drafts.abc123',
      }) as ReturnType<typeof createIfNotExists>[];

      expect(mutation?.document._id).toBe('drafts.sectionPages-abc123');
    });
  });

  describe('template_landing documents', () => {
    it('repoints every module_childPages item in modules[], leaving other modules alone', () => {
      const template = {
        ...baseDoc,
        _id: 'template-1',
        _type: 'template_landing',
        modules: [
          { _key: 'key1', _type: 'module_childPages', _ref: 'abc123' },
          { _key: 'key2', _type: 'module_cta', _ref: 'cta-1' },
          {
            _key: 'key3',
            _type: 'module_childPages',
            _ref: 'def456',
            _weak: true,
            _strengthenOnPublish: { type: 'module_childPages' },
          },
        ],
      };

      expect(migration.migrate.document(template)).toEqual([
        at(
          ['modules', { _key: 'key1' }],
          set({
            _key: 'key1',
            _type: 'module_sectionPages',
            _ref: 'sectionPages-abc123',
          }),
        ),
        at(
          ['modules', { _key: 'key3' }],
          set({
            _key: 'key3',
            _type: 'module_sectionPages',
            _ref: 'sectionPages-def456',
            _weak: true,
            _strengthenOnPublish: { type: 'module_sectionPages' },
          }),
        ),
      ]);
    });

    it('produces no patches for a template without a module_childPages item', () => {
      const template = {
        ...baseDoc,
        _id: 'template-1',
        _type: 'template_landing',
        modules: [{ _key: 'key2', _type: 'module_cta', _ref: 'cta-1' }],
      };

      expect(migration.migrate.document(template)).toBeUndefined();
    });

    it('produces no patches for a template with no modules field', () => {
      const template = {
        ...baseDoc,
        _id: 'template-1',
        _type: 'template_landing',
      };

      expect(migration.migrate.document(template)).toBeUndefined();
    });

    it('is idempotent — an already repointed template is left alone', () => {
      const template = {
        ...baseDoc,
        _id: 'template-1',
        _type: 'template_landing',
        modules: [
          {
            _key: 'key1',
            _type: 'module_sectionPages',
            _ref: 'sectionPages-abc123',
          },
        ],
      };

      expect(migration.migrate.document(template)).toBeUndefined();
    });
  });
});
