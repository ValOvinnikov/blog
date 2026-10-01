import { CAPABILITY, type TCapability } from '@blog/config/constants';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  type DocumentActionComponent,
  type DocumentActionsContext,
  type InputProps,
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

  describe('capability warning', () => {
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
  });
});
