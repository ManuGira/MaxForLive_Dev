var cst = {
	VOICE_COUNT: 4,
};

var ctx = {
	voice_index: -1,
};

function reset(){
	ctx.voice_index = -1;
}

inlets = 1;
outlets = cst.VOICE_COUNT;

function Message(pitch, velocity, channel) {
    this.pitch = pitch;
    this.velocity = velocity;
    this.channel = channel;
}

function _process(pitch, velocity, channel) {
	ctx.voice_index = (ctx.voice_index + 1) % cst.VOICE_COUNT;
	return [ctx.voice_index, new Message(pitch, velocity, channel)];
}

function list(pitch, velocity, channel) { 
	var result = _process(pitch, velocity, channel);
	var i = result[0];
	var message = result[1];
	outlet(i, message.pitch, message.velocity, message.channel);
}

function panic(){
	reset();
	for (var i = 0; i < cst.VOICE_COUNT; i++) {
		outlet(i, 0, 0, 1); // send note off to all voices
	}
}


function _is_message(value) {
	// validate the object structurally, using duck typing

    return value !== null &&
        typeof value === "object" &&
        typeof value.pitch === "number" &&
        value.pitch >= 0 && value.pitch <= 127 &&
        typeof value.velocity === "number" &&
        value.velocity >= 0 && value.velocity <= 127 &&
        typeof value.channel === "number" &&
        value.channel >= 1 && value.channel <= 16;
}

function _test_ProcessFunctionReturnsValidMessage() {
	var messages = [
		new Message(60, 100, 1),
		new Message(62, 100, 1),
		new Message(64, 0, 1),
		new Message(65, 127, 1),
		new Message(67, 100, 1),
	];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var result = _process(messages[i].pitch, messages[i].velocity, messages[i].channel);
		var voice_index = result[0];
		var message = result[1];
		if (!_is_message(message)) {
			error("ProcessFunctionReturnsValidMessage: Invalid message returned for input: " + messages[i] + "\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test ProcessFunctionReturnsValidMessage fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

// when receive "test" message, run process function unit test
function _test_NotesOnAreRoutedCorrectly() {
	var messages = [
		new Message(60, 100, 1),
		new Message(62, 100, 1),
		new Message(64, 100, 1),
		new Message(65, 100, 1),
		new Message(67, 100, 1),
	];
	expected_voice_indices = [0, 1, 2, 3, 0];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity, messages[i].channel);
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


function _test_NotesOffAreRoutedCorrectly() {
	// We remember which pitch is applied to which voice. when vel 0 is received, we must route it to the corresponding voice.
	var messages = [
		new Message(60, 100, 1),
		new Message(62, 100, 1),
		new Message(60, 0, 1),
	];
	expected_voice_indices = [0, 1, 0];

	var success = true;
	for (var i = 0; i < messages.length; i++) {
		var expected_voice_index = expected_voice_indices[i];
		var result = _process(messages[i].pitch, messages[i].velocity, messages[i].channel);
		var voice_index = result[0];

		if (voice_index != expected_voice_index) {
			error("NotesOffAreRoutedCorrectly: Expected voice index: " + expected_voice_index + ", but got: " + voice_index + " (i=" + i + ")\n");
			success = false;
		}
	}

	if (!success) {
		error("monopoly.js test NotesOffAreRoutedCorrectly fails!!!!!!!!!!!!!!!!!!!\n");
	}
	return success;
}

function test() {
	post("monopoly.js test started...\n");
	var success = true;

	reset();
	success &= _test_ProcessFunctionReturnsValidMessage();

	reset();
	success &= _test_NotesOnAreRoutedCorrectly();

	reset();
	success &= _test_NotesOffAreRoutedCorrectly();

	if (success) {
		post("monopoly.js all test passes!\n");
	}
}
