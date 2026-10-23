type TCall = { method: string; args: unknown[] };

export type TMockStructureNode = {
  kind: string;
  documentType?: string;
  calls: TCall[];
} & Record<string, unknown>;

const chainableMethods = {
  id: true,
  title: true,
  icon: true,
  child: true,
  items: true,
  schemaType: true,
  documentId: true,
  options: true,
  menuItems: true,
  action: true,
  filter: true,
  params: true,
  initialValueTemplates: true,
  initialValueTemplate: true,
};

/** Records every chained Structure Builder call, for reading back with `callArgs`. */
export const mockStructureNode = (
  kind: string,
  documentType?: string,
): TMockStructureNode => {
  const calls: TCall[] = [];
  const node: TMockStructureNode = { kind, documentType, calls };
  for (const method of Object.keys(chainableMethods)) {
    node[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return node;
    };
  }
  return node;
};

export const callArgs = (node: TMockStructureNode, method: string) =>
  node.calls.find((call) => call.method === method)?.args;
