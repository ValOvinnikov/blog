import {
  makeRawLogoItem,
  makeRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';

import { logoWallModuleQuery } from './query';

describe('logoWallModuleQuery', () => {
  it('filters to module_logoWall documents by id', () => {
    expect(logoWallModuleQuery.query).toContain('_type == "module_logoWall"');
    expect(logoWallModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawLogoWallModule(), headingBlock: null };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no logos', () => {
    const raw = { ...makeRawLogoWallModule(), logos: null };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a logo with no image', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [{ ...makeRawLogoItem(), image: null }],
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('parses a logo with no link', () => {
    const raw = {
      ...makeRawLogoWallModule(),
      logos: [{ ...makeRawLogoItem(), link: null }],
    };

    expect(() => logoWallModuleQuery.parse(raw)).not.toThrow();
    expect(logoWallModuleQuery.parse(raw).logos?.[0]?.link).toBeNull();
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(logoWallModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });
});
