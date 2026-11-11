# The `job:<session-name>` PR label

Gate 5 step 2 of `open-pull-request`. Run it only when `$CLAUDE_JOB_DIR` is
set; `<pr>` is the PR number `gh pr create` printed.

```
JOB=$(basename "$CLAUDE_JOB_DIR")
NAME=$(jq -r '.name // empty' "$CLAUDE_JOB_DIR/state.json")
SLUG=$(printf '%s' "${NAME:-$JOB}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' \
  | sed 's/^-*//; s/-*$//')

PREV=$(gh label list --limit 200 --json name,description \
  --jq ".[] | select(.description == \"$JOB\") | .name")

if [ -n "$PREV" ] && [ "$PREV" != "job:$SLUG" ]; then
  gh label edit "$PREV" --name "job:$SLUG"
elif [ -z "$PREV" ]; then
  gh label create "job:$SLUG" --color D4D8DC --description "$JOB"
fi
gh pr edit <pr> --add-label "job:$SLUG"
```

- **The chip shows the session's name** (`job:static-generation`); the job id
  is only the label's description, the lookup key that survives a rename. An
  unnamed job falls back to the id.
- **A renamed session renames its label** with `gh label edit --name`, which
  updates every PR already carrying it. Never mint a second label, and never
  use `--force` — it keys on the name, the wrong key.
- `board-keeper` deletes the label once no open PR carries it, on its
  `"after merge of #<n>"` trigger.
