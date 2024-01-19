sketch.default2d();
var defined = {
	random: function(delay, detune, dump){return [delay, detune, dump]},
	note: function(pitch, velocity){return [pitch, velocity]},
	notes_queue: function(times, notes, randoms, count_ids){
		return {
			times: times, // list of times where notes must be played
			notes: notes, // list of defined.note
			randoms: randoms, // list of defined.random
			count_ids: count_ids, // id of notes defined as a counter
		}
	},
	key_state: function(count_id, time){
		return {
			count_id: count_id,
			time: time
		}
	},
}

var ctx = {
	// outlets positions
	ol: {
		"note": 0
	},
	count_id: 0, // counting input notes
	now: 0,  // now and before in ms
	before: 0,
	MAX_NOTE_AGE_MS: 1000,

	scheduled_notes: defined.notes_queue([], [], [], []),
	passed_notes: defined.notes_queue([], [], [], []),
	keyboard_state: {},  // dictionary with pitch as key, defined.key_state as value

	amp_delay: 0,
	amp_dpitch: 0,
	amp_veldump: 0,
	amp_bounces: 0,

	bounds_delay: [0, 127],
	bounds_dpitch: [-6, 6],
	bounds_veldump: [1, 0],
	bounds_bounces: [0, 5],


	rgba:{// ableton theme colors
		dark_gray: [40/255,  40/255,  40/255, 1],
		orange: [255/255, 181/255, 150/255, 1],
		blue: [109/255, 215/255, 255/255, 1]
	}
}; 

function log() {
  for(var i=0,len=arguments.length; i<len; i++) {
    var message = arguments[i];
    if(message && message.toString) {
      var s = message.toString();
      if(s.indexOf("[object ") >= 0) {
        s = JSON.stringify(message);
      }
      post(s);
    }
    else if(message === null) {
      post("<null>");
    }
    else {
      post(message);
    }
  }
  post("\n");
}


function len(obj){
	var N = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) N++;
	}
	return N;
}

function draw_init(){
	with (sketch) {
		glclearcolor(ctx.rgba.dark_gray[0],ctx.rgba.dark_gray[1],ctx.rgba.dark_gray[2],ctx.rgba.dark_gray[3]);
		glcolor(ctx.rgba.blue[0],ctx.rgba.blue[1],ctx.rgba.blue[2],ctx.rgba.blue[3]);
		glclear();
		refresh();
	}
}

function interval_to_screen(val, bounds, amp){
	return 2*(val-bounds[0])/(bounds[1]-bounds[0])-amp;
}

function draw()
{
	with (sketch) {	
		glclearcolor(ctx.rgba.dark_gray[0],ctx.rgba.dark_gray[1],ctx.rgba.dark_gray[2],ctx.rgba.dark_gray[3]);
		glclear();	
		
		var minx = 0;
		var maxx = 0;		
		var maxy = 0;		
		var miny = 0;
		var maxr = 0;		
		for (i = 0; i < ctx.passed_notes.times.length; i++) { 
			
			var dt = ctx.now - ctx.passed_notes.times[i];
			var note = ctx.passed_notes.notes[i];
			var pitch = note[0];
			var vel = note[1];
			if (vel == 0) continue  // skip noteoffs

			var delay_rnd01 = ctx.passed_notes.randoms[i][0];
			var detune_rnd01 = ctx.passed_notes.randoms[i][1];
			var dump_rnd01 = ctx.passed_notes.randoms[i][2];

			var x = (delay_rnd01*2-1)*ctx.amp_delay/127;
			var y = (detune_rnd01*2-1)*ctx.amp_dpitch/6;
			var radius = 0.2*dt/ctx.MAX_NOTE_AGE_MS;
			var alpha = 2*(1-dump_rnd01) * Math.pow((1-dt/ctx.MAX_NOTE_AGE_MS), 2);
			glcolor(ctx.rgba.blue[0],ctx.rgba.blue[1],ctx.rgba.blue[2],alpha);

			maxx = Math.max(x, maxx);
			minx = Math.min(x, minx);
			maxy = Math.max(y, maxy);
			miny = Math.min(y, miny);
			maxr = Math.max(radius, maxr);

			moveto(x, y);
			framecircle(radius);
			//lineto(x1, y1);
		}
		refresh();
		//log(minx, maxx, miny, maxy, maxr);
	}

	// delete notes older than ctx.MAX_NOTE_AGE_MS
	var ind = sortedIndex(ctx.passed_notes.times, ctx.now - ctx.MAX_NOTE_AGE_MS);
	ctx.passed_notes.times.splice(0, ind);
	ctx.passed_notes.notes.splice(0, ind);
	ctx.passed_notes.randoms.splice(0, ind);
	ctx.passed_notes.count_ids.splice(0, ind);
}
	
function sortedIndex(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid] < value) low = mid + 1;
        else high = mid;
    }
    return low;
}


function process_noteon(pitch, velocity){
	// store note to measure its duration (in ms) later
	const kstate = defined.key_state(ctx.count_id, ctx.now);
	ctx.keyboard_state[pitch] = kstate;
	
	// bounces is number of suplementary notes
	var bounces = Math.floor(Math.random()*ctx.amp_bounces);
	for (var i = 0; i < bounces+1; i++) {
		var random_vector = defined.random(Math.random(), Math.random(), Math.random());
		
		var delay = Math.floor(random_vector[0]*ctx.amp_delay);
		var dpitch = Math.round((random_vector[1]*2-1)*ctx.amp_dpitch);
		var veldump = random_vector[2]*ctx.amp_veldump;

		var time_out = ctx.now + delay;
		var pitch_out = pitch + dpitch;
		var velocity_out = velocity*(1-veldump);

		var note_out = defined.note(pitch_out, velocity_out);

		var ind = sortedIndex(ctx.scheduled_notes.times, time_out);
		ctx.scheduled_notes.times.splice(ind, 0, time_out);
		ctx.scheduled_notes.notes.splice(ind, 0, note_out);
		ctx.scheduled_notes.randoms.splice(ind, 0, random_vector);
		ctx.scheduled_notes.count_ids.splice(ind, 0, ctx.count_id);
	}
	ctx.count_id += 1;
}

function process_noteoff(pitch){
	pitch = pitch.toString();
	const cid = ctx.keyboard_state[pitch].count_id;
	const note_start = ctx.keyboard_state[pitch].time;
	const note_length = ctx.now - note_start;
	delete ctx.keyboard_state[pitch];
	
	const PITCH_IND = 0;
	const VELOCITY_IND = 1;

	notes_to_add = defined.notes_queue([], [], [] ,[]);

	for (var i = 0; i < ctx.scheduled_notes.count_ids.length; i++) {
		if (ctx.scheduled_notes.count_ids[i] != cid){
			continue;
		}
		
		if (ctx.scheduled_notes.notes[i][VELOCITY_IND] == 0){
			continue;
		}
		const scheduled_pitch = ctx.scheduled_notes.notes[i][PITCH_IND];
		noteoff = defined.note(scheduled_pitch, 0);
		const time = ctx.scheduled_notes.times[i] + note_length;
		const random_vector = defined.random(0, 0, 0);
		
		notes_to_add.times.push(time);
		notes_to_add.notes.push(noteoff);
		notes_to_add.randoms.push(random_vector);
		notes_to_add.count_ids.push(cid);
	}
	for (var i = 0; i < notes_to_add.count_ids.length; i++) {		
		var ind = sortedIndex(ctx.scheduled_notes.times, notes_to_add.times[i]);
		ctx.scheduled_notes.times.splice(ind, 0, notes_to_add.times[i]);
		ctx.scheduled_notes.notes.splice(ind, 0, notes_to_add.notes[i]);
		ctx.scheduled_notes.randoms.splice(ind, 0, notes_to_add.randoms[i]);
		ctx.scheduled_notes.count_ids.splice(ind, 0, notes_to_add.count_ids[i]);
	}
}

function process_note_msg(note){
	var pitch = note[0];
	var velocity = note[1];
	if (velocity == 0){
		process_noteoff(pitch);
	} else {
		process_noteon(pitch, velocity);
	}
}

function process_max_dt_msg(max_dt_int){
	ctx.amp_delay = max_dt_int/127.0*127.0;
}
function process_max_dpitch_msg(max_dpitch){
	ctx.amp_dpitch = max_dpitch;
}
function process_max_veldump_msg(max_veldump){
	ctx.amp_veldump = max_veldump;
}
function process_max_bounces_msg(max_bounces){
	ctx.amp_bounces = max_bounces;
}

function get_notes_to_play(){
	var notes_to_play = defined.notes_queue([], [], [], []);
	if (ctx.scheduled_notes.times.length == 0) return notes_to_play;
	
	var ind_start = sortedIndex(ctx.scheduled_notes.times, ctx.before);
	var ind_end = sortedIndex(ctx.scheduled_notes.times, ctx.now);

	for (var i = ind_start; i < ind_end; i++) {  // TODO. find a way to do this without for loop. Maybe with splice?
		notes_to_play.times.push(ctx.scheduled_notes.times[i]);
		notes_to_play.notes.push(ctx.scheduled_notes.notes[i]);
		notes_to_play.randoms.push(ctx.scheduled_notes.randoms[i]);
		notes_to_play.count_ids.push(ctx.scheduled_notes.count_ids[i]);
	}
	return notes_to_play;
}

function outlet_note(note){
	outlet(ctx.ol["note"], note);
}

function play_notes(notes_queue){
	for (var i = 0; i < notes_queue.notes.length; i++) {
		note = notes_queue.notes[i];
		outlet_note(note);
	}
}


// for each noteoff in played_notes, remove noteoff and correspondong note on
function clear_noteoffs(played_notes){
	for (var i = 0; i < played_notes.count_ids.length; i++) {
		const velocity = played_notes.notes[i][1];
		if (velocity != 0) continue; // skip noteon

		const cid = played_notes.count_ids[i];
		var note_to_remove_ind = [];
		for (var ind = 0; ind < ctx.scheduled_notes.times.length; ind++){
			if (ctx.scheduled_notes.times[ind] > ctx.now) break;
			if (ctx.scheduled_notes.count_ids[ind] == cid) note_to_remove_ind.push(ind);
		}
		// remove notes
		const N = note_to_remove_ind.length;
		for (var ind = N-1; ind >= 0; ind--){
			ctx.scheduled_notes.times.splice(ind, 1);
			ctx.scheduled_notes.notes.splice(ind, 1);
			ctx.scheduled_notes.randoms.splice(ind, 1);
			ctx.scheduled_notes.count_ids.splice(ind, 1);
		}
	}
}

function msg_float(cputime){
	ctx.before = ctx.now;
	ctx.now = Math.floor(cputime);
	var notes_to_play = get_notes_to_play();
	
	play_notes(notes_to_play);

	ctx.passed_notes.times = ctx.passed_notes.times.concat(notes_to_play.times);
	ctx.passed_notes.notes = ctx.passed_notes.notes.concat(notes_to_play.notes);
	ctx.passed_notes.randoms = ctx.passed_notes.randoms.concat(notes_to_play.randoms);
	ctx.passed_notes.count_ids = ctx.passed_notes.count_ids.concat(notes_to_play.count_ids);

	clear_noteoffs(notes_to_play);
}

function anything(){
	var msg = arrayfromargs(messagename, arguments);
	//post("MSG: " + msg + "\n");
	var cmd = msg.shift();
	switch (cmd) {
		case 'note':
			process_note_msg(msg);
			break;
		case 'max_bounces': // float >= 0
			process_max_bounces_msg(msg);
			break;
		case 'max_dpitch': //float >= 0
			process_max_dpitch_msg(msg);
			break;
		case 'max_veldump': // float in [0, 1]
			process_max_veldump_msg(msg);
			break;
		case 'max_dt':  // int ms
			process_max_dt_msg(msg);
			break;
		case 'draw_ui':
			draw();
			break;
		
  	default:
    	post("UNKNOWN cmd: "+ cmd + " " + msg + "\n");
		bang();
	}
}


function initialize()
{
	post("I  N  I  T");
	
	// create a size function for objects (counting number of keys)
	Object.size = function(obj) {
		var size = 0, key;
  		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
  		}
  		return size;
	};
	outlets = Object.size(ctx.ol);

	//draw_init();
	post("I  A  L  I  Z  E\n");
}
initialize();

//if (jsarguments.length>1)
//	myval = jsarguments[1];
	
// TODO: Legato on same note not working
//	 (when note off is directly followed by a note on at the same time). 
// It can be tested with slow refreshing time