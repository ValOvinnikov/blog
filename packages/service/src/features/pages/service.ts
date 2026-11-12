import { createCookieStatementService } from './cookie-statement';
import { createHomeService } from './home';
import { createLandingPageService } from './landing';
import { createPagePathService } from './page-path';
import { createPageTitleService } from './page-title';
import { createPostService } from './post';
import { createBlogService } from './post-index';
import { createSectionDocumentService } from './section-document';
import { createSectionIndexService } from './section-index';
import { createTagService } from './tag';
import { createTagIndexService } from './tag-index';
import { createTopicService } from './topic';
import { createTopicIndexService } from './topic-index';

export function createPagesService() {
  return {
    home: createHomeService(),
    landing: createLandingPageService(),
    pagePath: createPagePathService(),
    pageTitle: createPageTitleService(),
    blog: createBlogService(),
    post: createPostService(),
    sectionDocument: createSectionDocumentService(),
    sectionIndex: createSectionIndexService(),
    cookieStatement: createCookieStatementService(),
    topic: createTopicService(),
    topicIndex: createTopicIndexService(),
    tag: createTagService(),
    tagIndex: createTagIndexService(),
  };
}
