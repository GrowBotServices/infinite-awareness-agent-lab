# Judge Testing Guide

## Recommended prompt

Copy the following text, or use the **Copy judge prompt** control in the left rail.

> You are testing the Infinite Awareness WebMCP Judge Sandbox. Use the page's site tools to guide Alex Morgan through the fictional Day 7 demonstration. First call `get_today_protocol` and `explain_safety_boundary`. Then call `prepare_session` with `durationMinutes` 3 and ask me to mark the visible demonstration session complete. Draft this fictional observation with `draft_observation`: “A quiet image of an open window appeared after I noticed tension in my shoulders. It felt useful as a prompt to widen the question, but I do not know whether it was novel or simply an ordinary association.” Show me the visible review draft, then stop and ask me to select the save confirmation on the webpage before calling `save_confirmed_observation`. After saving, propose 0–5 usefulness, novelty and testability scores, then stop and ask me to select the score confirmation before calling `score_blinded_outcome`. Call `analyse_personal_signal` and `compare_collective_signal` with `minimumSample` 40. Never infer, request or reveal the hidden experimental assignment. Finish by summarising the result and remind me to use the visible Reset fictional demonstration button.

## Under-three-minute walkthrough

| Time | Judge action | Expected visible result |
| --- | --- | --- |
| 0:00–0:20 | Open the sandbox and inspect available site tools. | Exactly eight top-level tools; four marked read only. |
| 0:20–0:40 | Run `get_today_protocol` and `explain_safety_boundary`. | Day 7 purpose and non-treatment, fictional-data, privacy and stop-rule boundaries. |
| 0:40–1:00 | Run `prepare_session` with `3`, then select **Mark demonstration complete**. | Session changes from Not prepared to Ready to Complete. |
| 1:00–1:25 | Insert the fictional sample and run `draft_observation`. | Structured draft appears visibly and remains Not saved. |
| 1:25–1:45 | Call save before checking the gate, then select the visible save confirmation and call again. | First call is blocked; second succeeds; gate reads Permission consumed. |
| 1:45–2:10 | Choose scores, call score before confirmation, then select the score confirmation and call again. | First call is blocked; second records scores without revealing an assignment. |
| 2:10–2:35 | Run personal analysis and compare the Global Signal at threshold 40. | Personal descriptive averages and fictional 48-session aggregate appear. |
| 2:35–2:50 | Raise threshold to 49 and compare again. | Aggregate comparison is suppressed because 48 is below 49. |
| 2:50–3:00 | Select **Reset fictional demonstration**. | Session, observation, draft, gates and scores return to the initial state. |

## Verification checklist

| Requirement | How to verify | Expected |
| --- | --- | --- |
| Tool discovery | Open Site tools or a WebMCP inspector in a compatible browser. | Exactly eight names from the repository tool list. |
| Read-only execution | Call all four read-only tools, compare visible journey state before and after. | No domain-state change. |
| Save before confirmation | Draft, leave save checkbox clear, call save. | Boundary error explaining visible confirmation is required. |
| First confirmed save | Select the page checkbox and call save. | Ephemeral save succeeds and the gate is consumed. |
| Save replay | Call save again without reset. | Boundary error explaining confirmation was already consumed. |
| Score before confirmation | Save a draft, leave score checkbox clear, call score. | Boundary error explaining visible confirmation is required. |
| First confirmed score | Select the score checkbox and call score. | Scores record once; `assignmentRevealed` remains false. |
| Score replay | Call score again without reset. | Boundary error explaining confirmation was already consumed. |
| Blinded protection | Inspect source, tools, results and storage. | No experimental assignment value exists or appears. |
| Cohort threshold | Compare with 49, then 40. | 49 suppresses; 40 permits the fictional 48-session aggregate. |
| Production isolation | Inspect browser network log and source. | No request to a production Infinite Awareness domain or service. |
| Non-WebMCP fallback | Open in a normal browser without the API. | Visible-page fallback indicator; every action remains available. |
| Reset | Complete part or all of the journey, then reset. | All volatile participant state returns to the initial scenario. |

## Compatible-browser note

WebMCP is an evolving web standard. Chrome documents an origin trial and local development flag, while ChatGPT site tools support the imperative top-level-page API but not iframe registration. Use a current compatible browser or the ChatGPT desktop built-in browser with site tools enabled. The sandbox itself remains usable when these features are unavailable.
