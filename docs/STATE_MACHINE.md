# State Machine Architecture

This document defines the state machine that governs the OSC-Agent contribution workflow.

## Core Flow (Happy Path)

IDLE → ANALYZING → SEARCHING → PLANNING → GENERATING → APPLYING → BUILDING → TESTING → REVIEWING → SUBMITTING → DONE

Each state represents a stage in the automated contribution pipeline.

---

## Control States

These states can be triggered from any non-terminal state.

- PAUSED — workflow temporarily halted
- ERROR — unrecoverable or retry-exceeded failure
- CANCELLED — user-aborted execution

---

## Transition Triggers

### Success Triggers

| Trigger       | From       | To         |
| ------------- | ---------- | ---------- |
| ANALYSIS_OK   | ANALYZING  | SEARCHING  |
| SEARCH_OK     | SEARCHING  | PLANNING   |
| PLAN_OK       | PLANNING   | GENERATING |
| GENERATION_OK | GENERATING | APPLYING   |
| APPLY_OK      | APPLYING   | BUILDING   |
| BUILD_OK      | BUILDING   | TESTING    |
| TEST_OK       | TESTING    | REVIEWING  |
| REVIEW_OK     | REVIEWING  | SUBMITTING |
| SUBMIT_OK     | SUBMITTING | DONE       |

### Control Triggers (Global)

| Trigger | From   | To             |
| ------- | ------ | -------------- |
| PAUSE   | any    | PAUSED         |
| RESUME  | PAUSED | previous state |
| CANCEL  | any    | CANCELLED      |

### Failure Triggers

| Trigger          | From  | To             |
| ---------------- | ----- | -------------- |
| FAIL (retryable) | any   | ERROR          |
| RETRY            | ERROR | previous state |

---

## Error Handling & Recovery

- Retryable failures return to the previous state
- Non-retryable failures lead to ERROR
- Exceeded retry limit leads to ERROR

---

## State Persistence Requirements

The system must persist:

- runId
- currentState
- updatedAt
- attempt
- context
- error { code, message, details }

Persistence implementation is handled in Task 4.2.
