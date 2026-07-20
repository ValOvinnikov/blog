import { describe, expect, it } from 'vitest';

import {
  buildLinkedInShareUrl,
  buildTwitterShareUrl,
} from './build-share-links';

describe('buildTwitterShareUrl', () => {
  it('builds the X intent URL with encoded text and url params', () => {
    expect(
      buildTwitterShareUrl('https://example.com/post', 'My post title'),
    ).toBe(
      'https://twitter.com/intent/tweet?text=My+post+title&url=https%3A%2F%2Fexample.com%2Fpost',
    );
  });

  it('encodes special characters in the title', () => {
    expect(buildTwitterShareUrl('https://example.com', 'A & B?')).toBe(
      'https://twitter.com/intent/tweet?text=A+%26+B%3F&url=https%3A%2F%2Fexample.com',
    );
  });
});

describe('buildLinkedInShareUrl', () => {
  it('builds the LinkedIn share-offsite URL with an encoded url param', () => {
    expect(buildLinkedInShareUrl('https://example.com/post')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fpost',
    );
  });
});
