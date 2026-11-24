#!/usr/bin/env bash
# Diagnostic only: always exits 0, so it can never fail the job that runs it.
set -uo pipefail

summary=''
for run in .turbo/runs/*.json; do
  [ -f "$run" ] || continue
  if [ -z "$summary" ] || [ "$run" -nt "$summary" ]; then summary=$run; fi
done
if [ -z "$summary" ]; then
  echo 'turbo-hash-inputs: no run summary in .turbo/runs'
  exit 0
fi

digest() { shasum -a 256 | cut -c1-16; }

jq -c '.globalCacheInputs | {line: "global", rootKey, hashOfExternalDependencies, environmentVariables, filesCount: (.files | length)}' "$summary"
echo "{\"line\":\"global-files\",\"digest\":\"$(jq -cS '.globalCacheInputs.files' "$summary" | digest)\"}"

jq -c '.tasks[]' "$summary" | while read -r task; do
  inputs_digest=$(jq -cS '.inputs // {}' <<< "$task" | digest)
  jq -c --arg inputsDigest "$inputs_digest" '{line: "task", taskId, hash, cache: .cache.status, hashOfExternalDependencies, dependencies, inputsDigest: $inputsDigest, inputsCount: ((.inputs // {}) | length), environmentVariables: (.environmentVariables | {specified, configured, inferred, passthrough})}' <<< "$task"
done

exit 0
