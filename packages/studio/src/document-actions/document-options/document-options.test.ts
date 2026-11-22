import { SendTestAction } from '@shinefold/studio/document-actions/send-test-action/send-test-action';
import { PAGE_POST_TYPE } from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { personSchema } from '@shinefold/studio/schema-types/documents/person/person';
import type { DocumentActionComponent, DocumentActionsContext } from 'sanity';

import { buildDocumentOptions } from './document-options';

const PublishAction: DocumentActionComponent = () => null;
const DuplicateAction: DocumentActionComponent = () => null;
const DeleteAction: DocumentActionComponent = () => null;
const DEFAULT_ACTIONS = [PublishAction, DuplicateAction, DeleteAction];

const actionsFor = (schemaType: string) =>
  buildDocumentOptions().actions(DEFAULT_ACTIONS, {
    schemaType,
  } as DocumentActionsContext);

describe(buildDocumentOptions, () => {
  it('leads a post’s menu with the test send, after the primary action', () => {
    expect(actionsFor(PAGE_POST_TYPE)).toStrictEqual([
      PublishAction,
      SendTestAction,
      DuplicateAction,
      DeleteAction,
    ]);
  });

  it('offers no test send on other documents', () => {
    expect(actionsFor(personSchema.name)).toStrictEqual(DEFAULT_ACTIONS);
  });
});
