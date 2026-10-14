# Dashboard composition proposals

Static design proposals, not screenshots or verification evidence. The user selected
C, then approved its integrated-panel revision for implementation on 2026-10-15.

The user retains the accompanied, one-action-at-a-time teaching flow and requests
less visible text, simpler results and clearer guidance. The proposals compare the
same moment: one request has been saved, its response was lost, and the next action
retries that same request. The first three proposals retained separate technical controls; the approved revision merges them.

| Proposal               | Composition                                          | Strength                                                | Tradeoff                                                   |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| A — Presentation       | Centered state comparison and one primary action     | Lowest visible complexity; best fit for accompanied use | Other scenario names appear only when navigation is opened |
| B — Event trail        | Three short events beside one saved-request receipt  | Makes the order of events explicit                      | More reading than A                                        |
| C — Scenario workspace | Persistent scenario rail and a request/reply diagram | Easy navigation and a view of the whole demonstration   | Uses more space and introduces more simultaneous choices   |

Recommended starting point: A, given the user's request for maximum simplicity in
an accompanied demonstration. The user subsequently selected C.

Shared interaction intent: a short situation, one current action, observed client
and server states, optional explanation, and technical evidence on demand. After
the retry, show the confirmed existing request and then offer the next experiment.
Actual implementation must derive counts and outcomes from API/database evidence,
retain unknown/unavailable states, preserve old sessions and support keyboard/reflow.

Generated with the built-in image_gen tool. Exact prompts, edits, reference source
and approval status are retained in the adjacent JSON files; prompts are also
embedded into each PNG. The existing screenshot supplies palette and typography,
not composition. Surface exploration seed: 1e147a4b; dealt structures 7, 6, 3.

## Selected C revision: integrated technical panel

The user selected C as the base and requested one unified page per scenario, with
both top-level tabs removed. c-integrated-technical-panel.png is the revised static
proposal, shown with the bottom drawer expanded. It is not a runtime screenshot.

The drawer is intended to start collapsed, remain scoped to the selected scenario,
and resize the workspace rather than cover its result or primary action. HTTP
attempts and observed saved records are distinct; no received 201 is invented for
a lost reply. Request identifiers and next-attempt tools sit beside that evidence.
Manual payload controls, retention clock, purge and reset are progressively disclosed
under Advanced tools, with existing destructive-action confirmation preserved.
The six scenarios share this shell; relevant events and tools vary with the case.
The revised composition is approved. Runtime captures and verification remain separate
from these generated references.
