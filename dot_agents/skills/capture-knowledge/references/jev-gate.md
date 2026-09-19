# Optional Jev assessment

Locate the existing hub through GHQ and consult its `docs/capture-gate.md` for current CLI and input details. The executable is `<hub>/target/release/capture-gate`; the `mise run capture -- ...` task from the hub builds/runs it if needed. Prefix commands with `rtk` where installed and use an explicit working directory.

Check `capture-gate status`. When a session is running, pass one concise candidate JSON object on stdin to `capture-gate judge --threshold 0.85`. Include relevant evidence excerpts, acceptance basis for a decision/preference, and matching existing records. Remove credentials and incidental sensitive material before sending anything: the candidate is submitted to the external TypeSafe API. Jev cannot inspect local paths or independently verify claims beyond the supplied state.

Use `capture` as a recommendation to proceed with the skill's source/acceptance checks; `review` calls for reevaluating the evidence; `skip` needs no note. A service error is not a positive judgment. Preserve meaningful uncertainty, and never infer authorization from the score. The threshold is provisional; use an explicitly requested cutoff when supplied. Do not lower it merely to obtain capture.

Session startup is an explicit user action or authorized setup task, using a 1Password secret reference. Do not retrieve keys into chat, write them to files, or restart/promote a session simply because ordinary capture work occurred. If no session is available, continue the ordinary capture workflow without repeatedly requesting credentials. The tool does not write notes, and no background inference runs between calls.
