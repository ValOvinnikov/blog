import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  type TCapability,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  type DocumentActionComponent,
  type DocumentActionsContext,
  type InputProps,
  type ItemProps,
} from 'sanity';

import { buildStudioConfig } from './studio-config';

vi.mock('sanity/structure', () => ({
  structureTool: (options: unknown) => ({ name: 'structureTool', options }),
}));
vi.mock('sanity-plugin-media', () => ({
  media: () => ({ name: 'media' }),
  mediaAssetSource: { name: 'media', title: 'Media' },
}));
vi.mock('@sanity/vision', () => ({
  visionTool: () => ({ name: 'visionTool' }),
}));
vi.mock('@sanity/code-input', () => ({
  codeInput: () => ({ name: 'codeInput' }),
}));

describe(buildStudioConfig, () => {
  it('builds a config from the given projectId/dataset/title', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      title: 'Test Studio',
    });

    expect(config.name).toBe('default');
    expect(config.title).toBe('Test Studio');
    expect(config.projectId).toBe('test-project');
    expect(config.dataset).toBe('test-dataset');
    expect(config.basePath).toBeUndefined();
  });

  it('sets basePath when provided', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      basePath: '/dashboard/studio',
      title: 'Test Studio',
    });

    expect(config.basePath).toBe('/dashboard/studio');
  });

  it('hides the migrationState system ledger from document actions and the new-document menu', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      title: 'Test Studio',
    });

    const actions = config.document?.actions;
    if (typeof actions !== 'function') {
      throw new Error('expected config.document.actions to be a function');
    }

    const prev: DocumentActionComponent[] = [];
    const context = {
      schemaType: migrationStateSchema.name,
    } as DocumentActionsContext;

    expect(actions(prev, context)).toEqual([]);
  });

  it.each([PAGE_HOME_TYPE, PAGE_LANDING_TYPE])(
    'creates a %s only through a language template',
    (type) => {
      const config = buildStudioConfig({
        projectId: 'test-project',
        dataset: 'test-dataset',
        title: 'Test Studio',
      });
      const templates = config.schema?.templates;
      if (typeof templates !== 'function') {
        throw new Error('expected config.schema.templates to be a function');
      }
      const template = (id: string, schemaType: string) => ({
        id,
        title: id,
        schemaType,
        value: {},
      });

      const ids = templates([
        template(type, type),
        template(`${type}-EN`, type),
        template('page_post', 'page_post'),
      ]).map(({ id }) => id);

      expect(ids).toEqual([`${type}-EN`, 'page_post']);
    },
  );

  describe('translations menu', () => {
    const languageFilterFor = (liveLocales: TLocaleIsoCode[]) => {
      const plugin = buildStudioConfig({
        projectId: 'test-project',
        dataset: 'test-dataset',
        title: 'Test Studio',
        liveLocales,
      }).plugins?.find(
        (entry) =>
          typeof entry === 'object' &&
          entry.name === '@sanity/document-internationalization',
      );
      const filter =
        typeof plugin === 'object'
          ? plugin.document?.unstable_languageFilter
          : undefined;
      if (typeof filter !== 'function') {
        throw new Error('expected the translations plugin language filter');
      }

      return filter([], {
        schemaType: PAGE_HOME_TYPE,
        documentId: 'homePage',
      } as Parameters<typeof filter>[1]);
    };

    it('offers no Translations menu with one live language', () => {
      expect(languageFilterFor([LOCALE_ISO_CODES.EN])).toHaveLength(0);
    });

    it('offers the Translations menu with two live languages', () => {
      expect(
        languageFilterFor([LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL]),
      ).toHaveLength(1);
    });
  });

  describe('capability warning', () => {
    const componentsFor = (enabledCapabilities: TCapability[]) => {
      const components = buildStudioConfig({
        projectId: 'test-project',
        dataset: 'test-dataset',
        title: 'Test Studio',
        enabledCapabilities,
      }).form?.components;
      if (!components?.input || !components.item) {
        throw new Error('capability components not registered');
      }

      return { input: components.input, item: components.item };
    };

    const renderRootInput = (
      enabledCapabilities: TCapability[] | undefined,
      typeName: string,
      path: InputProps['path'] = [],
    ) => {
      const config = buildStudioConfig({
        projectId: 'test-project',
        dataset: 'test-dataset',
        title: 'Test Studio',
        enabledCapabilities,
      });
      const Input = config.form?.components?.input;
      if (!Input) {
        return null;
      }
      const props = {
        path,
        schemaType: { name: typeName },
        renderDefault: () => createElement('div', null, 'default-input'),
      } as unknown as InputProps;

      return renderToStaticMarkup(
        createElement(
          ThemeProvider,
          { theme: buildTheme() },
          createElement(Input, props),
        ),
      );
    };

    it('shows the banner above the form when Newsletter is absent', () => {
      const html = renderRootInput([CAPABILITY.COMMENTS], 'module_newsletter');

      expect(html).toContain('Newsletter is turned on in Features');
      expect(html?.indexOf('Features')).toBeLessThan(
        html?.indexOf('default-input') ?? 0,
      );
    });

    it('shows no banner when Newsletter is present', () => {
      const html = renderRootInput(
        [CAPABILITY.NEWSLETTER],
        'module_newsletter',
      );

      expect(html).not.toContain('Features');
      expect(html).toContain('default-input');
    });

    it('registers no input override when no capabilities are given', () => {
      expect(renderRootInput(undefined, 'module_newsletter')).toBeNull();
    });

    it('shows no banner on nested inputs', () => {
      const html = renderRootInput([], 'module_newsletter', ['title']);

      expect(html).not.toContain('Features');
    });

    it('marks a gated module in the picker when its capability is off', () => {
      const { input } = componentsFor([CAPABILITY.COMMENTS]);
      const renderDefault = vi.fn(() => createElement('div'));
      const props = {
        path: ['modules'],
        schemaType: {
          name: 'array',
          jsonType: 'array',
          of: [{ name: 'module_newsletter', title: 'Newsletter' }],
        },
        renderDefault,
      } as unknown as InputProps;

      renderToStaticMarkup(createElement(input, props));

      expect(renderDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaType: expect.objectContaining({
            of: [
              expect.objectContaining({
                title: 'Newsletter (off in Features)',
              }),
            ],
          }),
        }),
      );
    });

    it.each([
      ['off', [CAPABILITY.COMMENTS], 1],
      ['on', [CAPABILITY.NEWSLETTER], 0],
    ])(
      'adds %s-state warnings to a page item',
      (_state, enabledCapabilities, expectedWarnings) => {
        const { item } = componentsFor(enabledCapabilities);
        const renderDefault = vi.fn(() => createElement('div'));
        const props = {
          path: ['modules', { _key: 'a' }],
          schemaType: { name: 'module_newsletter' },
          validation: [],
          renderDefault,
        } as unknown as ItemProps;

        renderToStaticMarkup(createElement(item, props));

        expect(renderDefault).toHaveBeenCalledWith(
          expect.objectContaining({
            validation: Array.from({ length: expectedWarnings }, () =>
              expect.objectContaining({
                level: 'warning',
                path: ['modules', { _key: 'a' }],
              }),
            ),
          }),
        );
      },
    );
  });
});
