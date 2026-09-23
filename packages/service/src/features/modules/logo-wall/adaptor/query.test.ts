import { logoWallModuleQuery } from './query';

describe('logoWallModuleQuery', () => {
  it('filters to module_logoWall documents by id', () => {
    expect(logoWallModuleQuery.query).toContain('_type == "module_logoWall"');
    expect(logoWallModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: null,
      logos: null,
      ctaButtons: null,
      displayMode: 'GRID',
      contentAlignment: null,
      layout: null,
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  const rawLogoImage = {
    alt: 'Acme Corp logo',
    hotspot: null,
    crop: null,
    asset: {
      _id: 'image-abc123-800x600-jpg',
      metadata: {
        lqip: null,
        dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
      },
    },
  };

  it('rejects a logo with no name', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: { heading: 'Trusted by', supportingText: null },
      logos: [
        { _id: 'block-logo-1', name: null, image: rawLogoImage, link: null },
      ],
      ctaButtons: null,
      displayMode: 'GRID',
      contentAlignment: null,
      layout: null,
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a logo with no image', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: { heading: 'Trusted by', supportingText: null },
      logos: [
        { _id: 'block-logo-1', name: 'Acme Corp', image: null, link: null },
      ],
      ctaButtons: null,
      displayMode: 'GRID',
      contentAlignment: null,
      layout: null,
    };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('parses a logo with no link', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: { heading: 'Trusted by', supportingText: null },
      logos: [
        {
          _id: 'block-logo-1',
          name: 'Acme Corp',
          image: rawLogoImage,
          link: null,
        },
      ],
      ctaButtons: null,
      displayMode: 'GRID',
      contentAlignment: null,
      layout: null,
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
