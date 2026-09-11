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
	var messages = [
		new Message(60, 100),
		new Message(62, 100),
		new Message(65, 127),
		new Message(67, 100),
	];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result[0];
		var message = result[1];
		if (!_is_message(message)) {
			error("ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero: Invalid message returned for input: " + messages[i] + "\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test ProcessFunctionReturnsValidMessageWhenVelocityIsNotZero fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function _test_ProcessFunctionReturnsNullWhenVelocityIsZero() {
	var messages = [
		new Message(60, 0),
		new Message(62, 0),
		new Message(64, 0),
	];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var result = _process(messages[i].pitch, messages[i].velocity);
		if (result !== null) {
			error("ProcessFunctionReturnsNullWhenVelocityIsZero: Expected null for input: " + messages[i] + "\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test ProcessFunctionReturnsNullWhenVelocityIsZero fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

// when receive "test" message, run process function unit test
function _test_NotesOnAreRoutedCorrectly() {
	var messages = [
		new Message(60, 100),
		new Message(62, 100),
		new Message(64, 100),
		new Message(65, 100),
		new Message(67, 100),
	];
	expected_voice_indices = [0, 1, 2, 3, 0];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
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
	// We remember which pitch is applied to which voice. when vel 0 is received, it is ignored.
	var messages = [
		new Message(60, 100),  // voice index is 0
		new Message(70, 100),  // voice index is 1
		new Message(60, 0),	// this message will be ignored, and _process should return null. 
		new Message(80, 100),  // voice index is 2
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
	// Implement the test for pitch 0 to 12 being used as commands for note offs.
	// This is a placeholder for the actual test logic.
	
	var messages = [
		new Message(60, 100),  // voice 0 has pitch 60
		new Message(62, 100),  // voice 1 has pitch 62
		new Message(64, 100),  // voice 2 has pitch 64
		new Message(65, 100),  // voice 3 has pitch 65
		new Message(0, 100),   // note on with pitch 0 is mapped to voice 0 note off
		new Message(1, 100),   // note on with pitch 1 is mapped to voice 1 note off
		new Message(2, 100),   // note on with pitch 2 is mapped to voice 2 note off
		new Message(3, 100),   // note on with pitch 3 is mapped to voice 3 note off
		new Message(0, 0),   // note off with pitch 0 is ignored
		new Message(1, 0),   // note off with pitch 1 is ignored
		new Message(2, 0),   // note off with pitch 2 is ignored
		new Message(3, 0),   // note off with pitch 3 is ignored
	];
	
	var expected_voice_indices = [0, 1, 2, 3, 0, 1, 2, 3, null, null, null, null];
	var expected_pitches = [60, 62, 64, 65, 60, 62, 64, 65, null, null, null, null];
	var expected_velocities = [100, 100, 100, 100, 0, 0, 0, 0, null, null, null, null];
	
	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var expected_pitch = expected_pitches[i];
		var expected_velocity = expected_velocities[i];
		var result = _process(messages[i].pitch, messages[i].velocity);
		var voice_index = result !== null ? result[0] : null;
		var result_msg = result !== null ? result[1] : null;
		var pitch = result_msg !== null ? result_msg.pitch : null;
		var velocity = result_msg !== null ? result_msg.velocity : null;

		if (voice_index !== expected_voice_index || pitch !== expected_pitch || velocity !== expected_velocity) {
			error("Pitch0To3AreUsedAsCommandsForNoteOffs: Expected (voice, pitch, velocity): (" + expected_voice_index + ", " + expected_pitch + ", " + expected_velocity + "), but got: (" + voice_index + ", " + pitch + ", " + velocity + ") (i=" + i + ")\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test Pitch0To3AreUsedAsCommandsForNoteOffs fails!!!!!!!!!!!!!!!!!!!\n");
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

	if (success) {
		post("monopoly.js all test passes!\n");
	}
}


post("INITIALIZATION\n");
reset();