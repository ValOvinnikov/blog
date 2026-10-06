export type TExistingRedirect = {
  _id: string;
  source?: string | null;
  destination?: string | null;
};

export type TLandingMove = {
  from: string;
  to: string;
  isPrefix: boolean;
  livePaths: readonly string[];
};

export type TRedirectPlan = {
  create: { source: string; destination: string; isPrefix: boolean } | null;
  update: { _id: string; destination: string }[];
  remove: string[];
};

export const EMPTY_REDIRECT_PLAN: TRedirectPlan = {
  create: null,
  update: [],
  remove: [],
};

export const planLandingRedirects = (
  { from, to, isPrefix, livePaths }: TLandingMove,
  existing: readonly TExistingRedirect[],
): TRedirectPlan => {
  if (from === to) return EMPTY_REDIRECT_PLAN;

  const live = new Set([to, ...livePaths]);
  const rebase = (path: string) => {
    if (path === from) return to;
    if (isPrefix && path.startsWith(`${from}/`)) {
      return `${to}${path.slice(from.length)}`;
    }
    return path;
  };

  const plan: TRedirectPlan = {
    create: { source: from, destination: to, isPrefix },
    update: [],
    remove: [],
  };

  existing.forEach(({ _id, source, destination }) => {
    if (!source) return;

    if (source === from || live.has(source)) {
      plan.remove.push(_id);
      return;
    }

    if (!destination) return;

    const rebased = rebase(destination);

    if (rebased === source) {
      plan.remove.push(_id);
    } else if (rebased !== destination) {
      plan.update.push({ _id, destination: rebased });
    }
  });

  return plan;
};
