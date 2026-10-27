import { LINK_TYPE } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { buildLinkDocumentFields } from './build-link-document-fields';

faker.seed(9);

const MOCK_LINK_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_LABEL = faker.lorem.words();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_URL = faker.internet.url();

describe(buildLinkDocumentFields, () => {
  it('carries the label, link type and internal reference of an internal link', () => {
    const fields = buildLinkDocumentFields(MOCK_LINK_ID, MOCK_TITLE, {
      label: MOCK_LABEL,
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: MOCK_PAGE_ID },
      openInNewTab: false,
    });

    expect(fields).toEqual({
      _id: MOCK_LINK_ID,
      _type: 'link',
      title: MOCK_TITLE,
      label: MOCK_LABEL,
      linkType: LINK_TYPE.INTERNAL,
      openInNewTab: false,
      internalReference: { _type: 'reference', _ref: MOCK_PAGE_ID },
    });
  });

  it('carries the url and no internal reference for an external link', () => {
    const fields = buildLinkDocumentFields(MOCK_LINK_ID, MOCK_TITLE, {
      label: MOCK_LABEL,
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_URL,
      openInNewTab: true,
    });

    expect(fields).toEqual({
      _id: MOCK_LINK_ID,
      _type: 'link',
      title: MOCK_TITLE,
      label: MOCK_LABEL,
      linkType: LINK_TYPE.EXTERNAL,
      openInNewTab: true,
      url: MOCK_URL,
    });
  });

  it('drops the platform and accessible label a link document cannot hold', () => {
    const fields = buildLinkDocumentFields(MOCK_LINK_ID, MOCK_TITLE, {
      label: MOCK_LABEL,
      accessibleLabel: faker.lorem.sentence(),
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_URL,
      platform: 'GITHUB',
    });

    expect(fields).toEqual({
      _id: MOCK_LINK_ID,
      _type: 'link',
      title: MOCK_TITLE,
      label: MOCK_LABEL,
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_URL,
    });
  });
});
