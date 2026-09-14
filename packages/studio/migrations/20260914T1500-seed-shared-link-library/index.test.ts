import { at, createIfNotExists, patch, set, unset } from 'sanity/migrate';

import { toSharedLinkId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('settings_navigation documents', () => {
  it('creates a shared_link for a legacy link item and repoints it to a linkRef', () => {
    const doc = {
      ...baseDoc,
      _id: 'settings_navigation',
      _type: 'settings_navigation',
      items: [
        {
          _key: 'nav-item-1',
          _type: 'link',
          label: 'Blog',
          linkType: 'INTERNAL',
          internalReference: { _type: 'reference', _ref: 'page_postIndex' },
          openInNewTab: false,
        },
      ],
    };

    const id = toSharedLinkId('settings_navigation', 'items-0');

    expect(migration.migrate.document(doc)).toEqual([
      createIfNotExists({
        _id: id,
        _type: 'shared_link',
        title: 'Blog',
        label: 'Blog',
        linkType: 'INTERNAL',
        internalReference: { _type: 'reference', _ref: 'page_postIndex' },
        url: undefined,
        openInNewTab: false,
      }),
      patch('settings_navigation', [
        at(
          'items',
          set([
            {
              _key: 'nav-item-1',
              _type: 'linkRef',
              link: { _type: 'reference', _ref: id },
            },
          ]),
        ),
      ]),
    ]);
  });

  it('is idempotent — a doc whose item is already a linkRef is left alone', () => {
    const doc = {
      ...baseDoc,
      _id: 'settings_navigation',
      _type: 'settings_navigation',
      items: [
        {
          _key: 'nav-item-1',
          _type: 'linkRef',
          link: {
            _type: 'reference',
            _ref: 'shared_link-settings_navigation-items-0',
          },
        },
      ],
    };

    expect(migration.migrate.document(doc)).toEqual([]);
  });

  it('produces no mutations for a document with no items field', () => {
    const doc = {
      ...baseDoc,
      _id: 'settings_navigation',
      _type: 'settings_navigation',
    };

    expect(migration.migrate.document(doc)).toEqual([]);
  });
});

describe('settings_footer documents', () => {
  it('creates a shared_link for a legacy social item and repoints it to a socialLinkRef, carrying platform but dropping accessibleLabel', () => {
    const doc = {
      ...baseDoc,
      _id: 'settings_footer',
      _type: 'settings_footer',
      social: [
        {
          _key: 'footer-social-1',
          _type: 'link',
          label: 'Linkedin',
          linkType: 'EXTERNAL',
          url: 'https://www.linkedin.com/in/val-ovinnikov',
          openInNewTab: true,
          platform: 'LINKEDIN',
          accessibleLabel: 'Linkedin profile',
        },
      ],
    };

    const id = toSharedLinkId('settings_footer', 'social-0');

    expect(migration.migrate.document(doc)).toEqual([
      createIfNotExists({
        _id: id,
        _type: 'shared_link',
        title: 'Linkedin',
        label: 'Linkedin',
        linkType: 'EXTERNAL',
        internalReference: undefined,
        url: 'https://www.linkedin.com/in/val-ovinnikov',
        openInNewTab: true,
      }),
      patch('settings_footer', [
        at(
          'social',
          set([
            {
              _key: 'footer-social-1',
              _type: 'socialLinkRef',
              platform: 'LINKEDIN',
              link: { _type: 'reference', _ref: id },
            },
          ]),
        ),
      ]),
    ]);
  });

  it('is idempotent — a doc whose item is already a socialLinkRef is left alone', () => {
    const doc = {
      ...baseDoc,
      _id: 'settings_footer',
      _type: 'settings_footer',
      social: [
        {
          _key: 'footer-social-1',
          _type: 'socialLinkRef',
          platform: 'LINKEDIN',
          link: {
            _type: 'reference',
            _ref: 'shared_link-settings_footer-social-0',
          },
        },
      ],
    };

    expect(migration.migrate.document(doc)).toEqual([]);
  });
});

describe('module_hero documents', () => {
  it('creates a shared_link for a populated secondaryAction and moves it onto actions as a Secondary ctaActionRef', () => {
    const doc = {
      ...baseDoc,
      _id: '1dfba15b-e987-4f2f-bd00-43c9de791409',
      _type: 'module_hero',
      secondaryAction: {
        label: 'Read Latest',
        linkType: 'INTERNAL',
        internalReference: { _type: 'reference', _ref: 'page_postIndex' },
        openInNewTab: false,
      },
    };

    const id = toSharedLinkId(doc._id, 'secondaryAction');

    expect(migration.migrate.document(doc)).toEqual([
      createIfNotExists({
        _id: id,
        _type: 'shared_link',
        title: 'Read Latest',
        label: 'Read Latest',
        linkType: 'INTERNAL',
        internalReference: { _type: 'reference', _ref: 'page_postIndex' },
        url: undefined,
        openInNewTab: false,
      }),
      patch(doc._id, [
        at(
          'actions',
          set([
            {
              _key: 'secondaryAction',
              _type: 'ctaActionRef',
              variant: 'SECONDARY',
              appearance: 'CONTAINED',
              link: { _type: 'reference', _ref: id },
            },
          ]),
        ),
        at('secondaryAction', unset()),
      ]),
    ]);
  });

  it('produces no mutations for a document with no secondaryAction', () => {
    const doc = {
      ...baseDoc,
      _id: '1dfba15b-e987-4f2f-bd00-43c9de791409',
      _type: 'module_hero',
    };

    expect(migration.migrate.document(doc)).toEqual([]);
  });

  it('is idempotent — a doc whose actions is already set is left alone, even with secondaryAction still present', () => {
    const doc = {
      ...baseDoc,
      _id: '1dfba15b-e987-4f2f-bd00-43c9de791409',
      _type: 'module_hero',
      actions: [{ _key: 'a', _type: 'ctaActionRef', variant: 'SECONDARY' }],
      secondaryAction: {
        label: 'Read Latest',
        linkType: 'INTERNAL',
      },
    };

    expect(migration.migrate.document(doc)).toEqual([]);
  });
});

describe('other document types', () => {
  it('is not visited — documentTypes scopes the migration to nav/footer/hero', () => {
    expect(migration.documentTypes).toEqual([
      'settings_navigation',
      'settings_footer',
      'module_hero',
    ]);
  });
});
