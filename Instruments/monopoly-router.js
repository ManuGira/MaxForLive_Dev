var cst = {
	VOICE_COUNT: 4,
};

var ctx = {
	voice_index: -1,
	voices_last_message: null,
};

function reset(){
	ctx.voice_index = -1;
    ctx.voices_last_message = new Array(cst.VOICE_COUNT);
    for (var i = 0; i < cst.VOICE_COUNT; i++) {
        ctx.voices_last_message[i] = null;
    }
}

inlets = 1;
outlets = 1;

function Message(pitch, velocity) {
    this.pitch = pitch;
    this.velocity = velocity;
}

function _process(pitch, velocity) {
	if (velocity === 0) {
		// Note off message are ignored
		return null;
	}		

	if (pitch < 12){
		// pitches 0 to 11 are used as commands for note offs
		// for example, if pitch is 1, we recover the pitch of voice 1 and send a note off message for it
		var target_voice_index = pitch % 12;
		var last_message = ctx.voices_last_message[target_voice_index];
		if (last_message !== null) {
			// send note off message for the last message of this voice
			var note_off_msg = new Message(last_message.pitch, 0);
			ctx.voices_last_message[target_voice_index] = null;
			return [target_voice_index, note_off_msg];
		}
		return null;
	}

	// round robin allocation of voices for note on messages
	ctx.voice_index = (ctx.voice_index + 1) % cst.VOICE_COUNT;
	var target_voice_index = ctx.voice_index;

	var msg = new Message(pitch, velocity);
	ctx.voices_last_message[target_voice_index] = msg;
	return [target_voice_index, msg];
}

function list(pitch, velocity) { 
	var result = _process(pitch, velocity);
	if (result === null) {
		return;
	}
	var i = result[0];
	var message = result[1];
	outlet(0, i, [message.pitch, message.velocity]);
}

function panic(){
	reset();
	for (var i = 0; i < cst.VOICE_COUNT; i++) {
		outlet(0, i, [0, 0, 1]); // send note off to all voices
	}
}


function _is_message(value) {
	// validate the object structurally, using duck typing

    return value !== null &&
        typeof value === "object" &&
        typeof value.pitch === "number" &&
        value.pitch >= 0 && value.pitch <= 127 &&
        typeof value.velocity === "number" &&
        value.velocity >= 0 && value.velocity <= 127;
}

function _test_ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero() {
	// Test that regular notes (pitch >= 12) with velocity > 0 produce valid messages
	// No control pitches held, so routing uses all voices [0, 1, 2, 3]
	var messages = [
		new Message(60, 100),
		new Message(62, 100),
		new Message(65, 127),
		new Message(67, 100),
	];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var result = _process(messages[i].pitch, messages[i].velocity);
		if (result === null) {
			error("ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero: Expected non-null result for regular note (pitch >= 12)\n");
			success = false;
			continue;
		}
		var message = result[1];
		if (!_is_message(message)) {
			error("ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero: Invalid message returned for input: pitch=" + messages[i].pitch + ", vel=" + messages[i].velocity + "\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_ProcessFunctionReturnsNullWhenVelocityIsZero() {
	// Test that note-off messages (velocity === 0) are handled correctly:
	// - Regular notes (pitch >= 12) with velocity 0: return null (note-offs ignored)
	// - Control pitches (pitch < 12) with velocity 0: may return null or a note-off message
	//   depending on whether notes were routed to that voice
	
	var messages = [
		new Message(60, 0),   // Regular note off - should return null
		new Message(62, 0),   // Regular note off - should return null
		new Message(64, 0),   // Regular note off - should return null
	];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var result = _process(messages[i].pitch, messages[i].velocity);
		// Regular note-offs (pitch >= 12, velocity 0) should return null
		if (result !== null) {
			error("ProcessFunctionReturnsNullWhenVelocityIsZero: Expected null for regular note-off (pitch >= 12, vel 0), got non-null\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test ProcessFunctionReturnsNullWhenVelocityIsZero fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

// Test round-robin routing with no control pitches held
// When no control pitches (pitch < 12) are active, is equivalent to hold voices [0, 1, 2, 3]
function _test_NotesOnAreRoutedCorrectly() {
	var messages = [
		new Message(60, 100),  // Should route to voice 0 (all voices active by default)
		new Message(62, 100),  // Should route to voice 1
		new Message(64, 100),  // Should route to voice 2
		new Message(65, 100),  // Should route to voice 3
		new Message(67, 100),  // Should route to voice 0 (wrap around)
	];
	expected_voice_indices = [0, 1, 2, 3, 0];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		if (result === null) {
			error("NotesOnAreRoutedCorrectly: Expected non-null result at i=" + i + "\n");
			success = false;
			continue;
		}
		var voice_index = result[0];

		if (voice_index != expected_voice_index) {
			error("NotesOnAreRoutedCorrectly: Expected voice index: " + expected_voice_index + ", but got: " + voice_index + " (i=" + i + ")\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test NotesOnAreRoutedCorrectly fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}


function _test_NotesOffAreNotIncrementingVoiceIndex() {
	// Test that regular note-offs (velocity 0, pitch >= 12) do not increment the voice index
	// Round-robin continues as if the note-off never happened
	var messages = [
		new Message(60, 100),  // Regular note, routes to voice 0
		new Message(70, 100),  // Regular note, routes to voice 1
		new Message(60, 0),    // Regular note-off (pitch >= 12) - ignored, returns null
		new Message(80, 100),  // Regular note, routes to voice 2 (not wrapped back to 0)
	];
	var expected_voice_indices = [0, 1, null, 2];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;

		if (voice_index !== expected_voice_index) {
			error("NotesOffAreNotIncrementingVoiceIndex: Expected voice index: " + expected_voice_index + ", but got: " + voice_index + " (i=" + i + ")\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test NotesOffAreNotIncrementingVoiceIndex fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}


function _test_Pitch0To3AreUsedAsCommandsForNoteOffs() {
	// Test control pitches (pitch < 12, velocity > 0) define the active voice routing set
	// When control pitches 0, 1, 2, 3 are held, only those voices receive routing
	// Pitches < 12 with velocity 0 release the control and may send note-offs if no notes were routed
	
	var messages = [
		new Message(60, 100),  // Regular note - activates voice 0 (all voices active by default)
		new Message(62, 100),  // Regular note - activates voice 1
		new Message(64, 100),  // Regular note - activates voice 2
		new Message(65, 100),  // Regular note - activates voice 3
		new Message(0, 100),   // Control pitch 0 activation (velocity > 0) - activate voice 0 as control pitch
		new Message(1, 100),   // Control pitch 1 activation (velocity > 0) - activate voice 1 as control pitch
		new Message(2, 100),   // Control pitch 2 activation (velocity > 0) - activate voice 2 as control pitch
		new Message(3, 100),   // Control pitch 3 activation (velocity > 0) - activate voice 3 as control pitch
		new Message(0, 0),     // Control pitch 0 released - no notes were routed to voice 0 since control pitch 0 activation occured, so note-off
		new Message(1, 0),     // Control pitch 1 released - no notes were routed to voice 1 since control pitch 1 activation occured, so note-off
		new Message(2, 0),     // Control pitch 2 released - no notes were routed to voice 2 since control pitch 2 activation occured, so note-off
		new Message(3, 0),     // Control pitch 3 released - no notes were routed to voice 3 since control pitch 3 activation occured, so note-off
	];
	
	// With new behavior:
	// 1. Regular notes (pitch >= 12) route to voices [0,1,2,3] in round-robin
	// 2. Control pitches (pitch < 12, vel > 0) RESET the note-sent tracking for that voice (no routing output)
	// 3. Control pitch releases (pitch < 12, vel = 0) send note-offs ONLY if no notes were routed AFTER activation
	// 
	// In this test:
	// - Notes 60-65 route to voices 0-3 (before control pitches activated)
	// - Control pitches 0-3 activate and RESET tracking for those voices
	// - Control pitch releases send note-offs because NO notes were routed AFTER the control pitches were activated
	var expected_voice_indices = [0, 1, 2, 3, null, null, null, null, 0, 1, 2, 3];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;

		if (voice_index !== expected_voice_index) {
			error("Pitch0To3AreUsedAsCommandsForNoteOffs: Expected voice index: " + expected_voice_index + ", but got: " + voice_index + " at i=" + i + " (pitch=" + messages[i].pitch + ", vel=" + messages[i].velocity + ")\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test Pitch0To3AreUsedAsCommandsForNoteOffs fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}


function _test_Example1_SingleControlPitchHeld() {
	// Example 1: Single Control Pitch Held
	// 1. Control pitch 1 activated → Activate voice 1, RESET tracking
	// 2. Regular note 60 → Route to voice 1 (mark as "note sent")
	// 3. Regular note 62 → Route to voice 1 (only voice 1 active)
	// 4. Control pitch 1 released → Note WAS sent to voice 1 AFTER activation, so NO note-off
	
	var messages = [
		new Message(1, 100),   // Control pitch 1 activation
		new Message(60, 100),  // Regular note
		new Message(62, 100),  // Regular note
		new Message(1, 0),     // Control pitch 1 release
	];
	
	var expected_voice_indices = [null, 1, 1, null];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		
		if (voice_index !== expected) {
			error("Example1_SingleControlPitchHeld: Expected voice " + expected + " at i=" + i + ", got " + voice_index + "\n");
			success = false;
		}
	}
	
	if (!success) {
		error("monopoly.js test Example1_SingleControlPitchHeld fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_Example2_MultipleControlPitchesReleaseOne() {
	// Example 2: Multiple Control Pitches, Release One
	// 1. Control pitch 1 activated → RESET tracking for voice 1
	// 2. Control pitch 3 activated → RESET tracking for voice 3 (active set: [1, 3])
	// 3. Regular note 60 → Route to voice 1 (first in [1, 3])
	// 4. Control pitch 1 released → Note WAS sent to voice 1 AFTER activation, so NO note-off
	// 5. Regular note 62 → Route to voice 3 (now only voice 3 is active)
	
	var messages = [
		new Message(1, 100),   // Control pitch 1 activation
		new Message(3, 100),   // Control pitch 3 activation
		new Message(60, 100),  // Regular note
		new Message(1, 0),     // Control pitch 1 release
		new Message(62, 100),  // Regular note
	];
	
	var expected_voice_indices = [null, null, 1, null, 3];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		
		if (voice_index !== expected) {
			error("Example2_MultipleControlPitchesReleaseOne: Expected voice " + expected + " at i=" + i + ", got " + voice_index + "\n");
			success = false;
		}
	}
	
	if (!success) {
		error("monopoly.js test Example2_MultipleControlPitchesReleaseOne fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_Example3_NotesSentBeforeActivationDontCount() {
	// Example 3: Notes Sent Before Control Pitch Activation Don't Count
	// 1. Regular note 60 → Route to voice 0 (all voices active)
	// 2. Regular note 62 → Route to voice 1 (all voices active)
	// 3. Control pitch 0 activated → RESET tracking for voice 0
	// 4. Control pitch 1 activated → RESET tracking for voice 1
	// 5. Control pitch 0 released → NO notes sent to voice 0 AFTER activation, so SEND note-off
	// 6. Control pitch 1 released → NO notes sent to voice 1 AFTER activation, so SEND note-off
	
	var messages = [
		new Message(60, 100),  // Regular note (before control pitch activation)
		new Message(62, 100),  // Regular note (before control pitch activation)
		new Message(0, 100),   // Control pitch 0 activation
		new Message(1, 100),   // Control pitch 1 activation
		new Message(0, 0),     // Control pitch 0 release
		new Message(1, 0),     // Control pitch 1 release
	];
	
	var expected_voice_indices = [0, 1, null, null, 0, 1];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		
		if (voice_index !== expected) {
			error("Example3_NotesSentBeforeActivationDontCount: Expected voice " + expected + " at i=" + i + ", got " + voice_index + "\n");
			success = false;
		}
	}
	
	if (!success) {
		error("monopoly.js test Example3_NotesSentBeforeActivationDontCount fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_Example4_ControlPitchActivatedAndReleasedWithoutNotes() {
	// Example 4: Control Pitch Activated and Released Without Any Notes (After Activation)
	// 1. Control pitch 2 activated → RESET tracking for voice 2
	// 2. Control pitch 2 released → NO notes sent to voice 2 AFTER activation, so SEND note-off
	
	var messages = [
		new Message(2, 100),   // Control pitch 2 activation
		new Message(2, 0),     // Control pitch 2 release
	];
	
	var expected_voice_indices = [null, 2];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		
		if (voice_index !== expected) {
			error("Example4_ControlPitchActivatedAndReleasedWithoutNotes: Expected voice " + expected + " at i=" + i + ", got " + voice_index + "\n");
			success = false;
		}
	}
	
	if (!success) {
		error("monopoly.js test Example4_ControlPitchActivatedAndReleasedWithoutNotes fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_Example5_MixedSomeControlPitchesWithNotesSomeWithout() {
	// Example 5: Mixed - Some Control Pitches With Notes, Some Without
	// 1. Control pitch 0 activated → RESET tracking for voice 0
	// 2. Control pitch 1 activated → RESET tracking for voice 1
	// 3. Control pitch 3 activated → RESET tracking for voice 3 (active set: [0, 1, 3])
	// 4. Regular note 60 → Route to voice 0 (first in [0, 1, 3])
	// 5. Regular note 62 → Route to voice 1 (second in [0, 1, 3])
	// 6. Control pitch 3 released → NO notes sent to voice 3 AFTER activation, so SEND note-off
	// 7. Control pitch 1 released → Notes WERE sent to voice 1 AFTER activation, so NO note-off
	// 8. Control pitch 0 released → Notes WERE sent to voice 0 AFTER activation, so NO note-off
	
	var messages = [
		new Message(0, 100),   // Control pitch 0 activation
		new Message(1, 100),   // Control pitch 1 activation
		new Message(3, 100),   // Control pitch 3 activation
		new Message(60, 100),  // Regular note
		new Message(62, 100),  // Regular note
		new Message(3, 0),     // Control pitch 3 release
		new Message(1, 0),     // Control pitch 1 release
		new Message(0, 0),     // Control pitch 0 release
	];
	
	var expected_voice_indices = [null, null, null, 0, 1, 3, null, null];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		
		if (voice_index !== expected) {
			error("Example5_MixedSomeControlPitchesWithNotesSomeWithout: Expected voice " + expected + " at i=" + i + ", got " + voice_index + "\n");
			success = false;
		}
	}
	
	if (!success) {
		error("monopoly.js test Example5_MixedSomeControlPitchesWithNotesSomeWithout fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function test() {
	post("monopoly.js test started...\n");
	var success = true;

	reset();
	success &= _test_ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero();
	
	reset();
	success &= _test_ProcessFunctionReturnsNullWhenVelocityIsZero();

	reset();
	success &= _test_NotesOnAreRoutedCorrectly();

	reset();
	success &= _test_NotesOffAreNotIncrementingVoiceIndex();

	reset();
	success &= _test_Pitch0To3AreUsedAsCommandsForNoteOffs();

	reset();
	success &= _test_Example1_SingleControlPitchHeld();

	reset();
	success &= _test_Example2_MultipleControlPitchesReleaseOne();

	reset();
	success &= _test_Example3_NotesSentBeforeActivationDontCount();

	reset();
	success &= _test_Example4_ControlPitchActivatedAndReleasedWithoutNotes();

	reset();
	success &= _test_Example5_MixedSomeControlPitchesWithNotesSomeWithout();

	if (success) {
		post("monopoly.js all test passes!\n");
	}
}


post("INITIALIZATION\n");
reset();