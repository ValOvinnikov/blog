import { pageMetadata } from './page-metadata';

describe('pageMetadata', () => {
  it('resolves the title for the given pageMetadata key', async () => {
    await expect(pageMetadata('features')).resolves.toEqual({
      title: 'Features · Admin',
    });
    await expect(pageMetadata('look')).resolves.toEqual({
      title: 'Look · Admin',
    });
    await expect(pageMetadata('voice')).resolves.toEqual({
      title: 'Voice · Admin',
    });
  });
});
