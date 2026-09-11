# Monopoly MIDI Router - New Behavior Specification

## Overview

The Monopoly Router is a 4-voice MIDI router that intelligently allocates incoming MIDI notes to voices. The router distinguishes between **control pitches** (MIDI pitches < 12) that define the active voice set, and **regular notes** (MIDI pitches >= 12) that are routed to voices.

---

## Core Concepts

### 1. Control Pitches vs Regular Notes

- **Regular notes** (MIDI pitch >= 12): Standard musical notes that need to be routed to a voice
- **Control pitches** (MIDI pitch < 12): Special control pitches that dynamically define which voices are active for routing
  - Pitch value directly maps to voice index (pitch 0 → voice 0, pitch 1 → voice 1, etc.)

### 2. Voice Routing Set

The router maintains a **dynamic voice routing set** that changes based on held control pitches:
- **If no control pitches are held**: Route incoming notes to ALL voices (0, 1, 2, 3) in round-robin fashion
- **If one or more control pitches are held**: Route incoming notes ONLY to the voices corresponding to those held control pitches, in the order they were activated

---

## Detailed Behavior

### Regular Note Handling (pitch >= 12, velocity > 0)

1. Determine the active voice set:
   - If any control pitches are held: Use only those voice indices (in order of activation)
   - If no control pitches are held: Use all voices [0, 1, 2, 3]

2. Use round-robin allocation within the active voice set to assign the next available voice

3. Send the note to the assigned voice and remember this mapping (pitch-to-voice)

**Example:**
```
Scenario: Control pitches 1 and 3 are held (activated in that order)
Active voice set: [1, 3]

Incoming notes:
  - Regular note 60 (vel 100) → voice 1 (first in active set)
  - Regular note 62 (vel 100) → voice 3 (second in active set)
  - Regular note 65 (vel 100) → voice 1 (wrap around, first in active set)
  - Regular note 67 (vel 100) → voice 3 (second in active set)
```

---

### Control Pitch Activation (pitch < 12, velocity > 0)

When a control pitch p (where p < 12 and velocity > 0) is received:

1. Mark voice p as "active" for routing
2. Add voice p to the active voice routing set (in order of activation)
3. **Reset the "note sent" tracking flag for voice p** — only notes routed AFTER this activation will be tracked
4. Remember the order in which control pitches were activated (this defines the order of the routing cycle)

---

### Note Off Handling (velocity === 0)

Note off messages are handled differently based on the pitch:

#### For Regular Pitches (pitch >= 12)

- Regular note-off messages for pitches >= 12 are **ignored** (no action taken)

#### For Control Pitches (pitch < 12)

When a control pitch p is released (velocity === 0):

1. Mark voice p as "inactive" in the control pitch set
2. **Only if** no regular note has been routed to voice p **SINCE this control pitch was activated**:
   - Send a note-off message (pitch p, velocity 0) to voice p
3. If a regular note WAS routed to voice p after activation, do nothing (the voice may be sustaining a note)

**Rationale:** When you activate a control pitch, we reset tracking for that voice. If no notes are routed to it after activation, releasing the control pitch sends a note-off to clean up. But if notes were routed after activation, you might want them to sustain.

---

## Examples

### Example 1: Single Control Pitch Held

```
Events:
  1. Control pitch 1, velocity 100 (press) → Activate voice 1
  2. Regular note 60, velocity 100       → Route to voice 1 (marked as "note sent to voice 1")
  3. Regular note 62, velocity 100       → Route to voice 1 (wrap around, only voice 1 is active)
  4. Control pitch 1, velocity 0 (release) → A note WAS sent to voice 1, so NO note-off sent
```

### Example 2: Multiple Control Pitches, Release One

```
Events:
  1. Control pitch 1, velocity 100       → Activate voice 1
  2. Control pitch 3, velocity 100       → Activate voice 3
  3. Regular note 60, velocity 100       → Route to voice 1 (first in activation order)
  4. Control pitch 1, velocity 0 (release) → A note WAS sent to voice 1, so NO note-off sent
  5. Regular note 62, velocity 100       → Route to voice 3 (now only voice 3 is active)
```

### Example 3: Notes Sent Before Control Pitch Activation Don't Count

```
Events:
  1. Regular note 60, velocity 100       → Route to voice 0 (all voices active)
  2. Regular note 62, velocity 100       → Route to voice 1 (all voices active)
  3. Control pitch 0, velocity 100       → Activate voice 0, RESET note-sent tracking for voice 0
  4. Control pitch 1, velocity 100       → Activate voice 1, RESET note-sent tracking for voice 1
  5. Control pitch 0, velocity 0 (release) → NO notes sent to voice 0 AFTER activation, so SEND note-off
  6. Control pitch 1, velocity 0 (release) → NO notes sent to voice 1 AFTER activation, so SEND note-off

Key point: Notes 60 and 62 were sent to voices 0 and 1 BEFORE the control pitches were activated,
so they don't prevent the note-offs from being sent when the control pitches are released.
```

### Example 4: Control Pitch Activated and Released Without Any Notes (After Activation)

```
Events:
  1. Control pitch 2, velocity 100       → Activate voice 2, RESET note-sent tracking
  2. Control pitch 2, velocity 0 (release) → NO notes sent to voice 2 AFTER activation, so SEND note-off to voice 2
```

### Example 5: Mixed - Some Control Pitches With Notes, Some Without

```
Events:
  1. Control pitch 0, velocity 100       → Activate voice 0, RESET note-sent tracking for voice 0
  2. Control pitch 1, velocity 100       → Activate voice 1, RESET note-sent tracking for voice 1
  3. Control pitch 3, velocity 100       → Activate voice 3, RESET note-sent tracking for voice 3
     (Active routing set is now [0, 1, 3])
  4. Regular note 60, velocity 100       → Route to voice 0 (first in [0, 1, 3], mark "note sent to 0")
  5. Regular note 62, velocity 100       → Route to voice 1 (second in [0, 1, 3], mark "note sent to 1")
  6. Control pitch 3, velocity 0 (release) → NO notes sent to voice 3 AFTER activation, so SEND note-off
  7. Control pitch 1, velocity 0 (release) → Notes WERE sent to voice 1 after activation, so NO note-off
  8. Control pitch 0, velocity 0 (release) → Notes WERE sent to voice 0 after activation, so NO note-off
```

---

## Special Cases

### No Control Pitches Held (Default Mode)

If no control pitches are currently held:
- All regular notes route to voices [0, 1, 2, 3] in round-robin order
- Voice allocation works as in the original version
- Note-offs for regular notes are ignored
- Control pitch releases (velocity 0) that occur with no active control pitches are ignored

### Panic Mode

The `panic()` function still sends note-off messages to all voices to ensure a clean state.

---

## State Management Requirements

To implement this behavior, the router must track:

1. **Held control pitches**: Which control pitches are currently active (pressed but not released)
2. **Control pitch activation order**: The sequence in which control pitches were pressed (defines routing order)
3. **Voice note status**: For each voice, whether a note has been routed to it **AFTER the control pitch for that voice was activated**
   - **Critical:** Reset this flag when a control pitch is activated
   - Only notes routed AFTER activation are tracked
   - If no notes are tracked when the control pitch is released, send a note-off
