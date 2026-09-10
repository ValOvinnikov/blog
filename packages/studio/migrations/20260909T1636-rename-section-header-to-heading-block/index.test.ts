import { at, set, unset } from 'sanity/migrate';

import { renameSectionHeaderToHeadingBlock } from './index';

describe(renameSectionHeaderToHeadingBlock, () => {
  it('moves a plain sectionHeader onto headingBlock and rewrites its _type', () => {
    const sectionHeader = {
      _type: 'sectionHeader',
      heading: 'Latest posts',
      supportingText: 'Fresh from the blog',
    };

    const result = renameSectionHeaderToHeadingBlock({ sectionHeader });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'headingBlock',
          heading: 'Latest posts',
          supportingText: 'Fresh from the blog',
        }),
      ),
      at('sectionHeader', unset()),
    ]);
  });

  it('moves a requiredHeadingSectionHeader onto headingBlock as requiredHeadingBlock', () => {
    const sectionHeader = {
      _type: 'requiredHeadingSectionHeader',
      heading: 'Get in touch',
    };

    const result = renameSectionHeaderToHeadingBlock({ sectionHeader });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({ _type: 'requiredHeadingBlock', heading: 'Get in touch' }),
      ),
      at('sectionHeader', unset()),
    ]);
  });

  it('is idempotent — a doc already migrated to headingBlock is left alone', () => {
    const headingBlock = { _type: 'headingBlock', heading: 'Already moved' };

    const result = renameSectionHeaderToHeadingBlock({ headingBlock });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc with both fields set is left alone, not clobbered', () => {
    const sectionHeader = { _type: 'sectionHeader', heading: 'Old' };
    const headingBlock = { _type: 'headingBlock', heading: 'Already moved' };

    const result = renameSectionHeaderToHeadingBlock({
      sectionHeader,
      headingBlock,
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a doc that never had a sectionHeader', () => {
    const result = renameSectionHeaderToHeadingBlock({});

    expect(result).toBeUndefined();
  });
});
