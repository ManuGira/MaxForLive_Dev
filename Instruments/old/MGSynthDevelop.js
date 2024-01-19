var myval=0;
var ctx = {
		adsr_raw: [0.5, 0.5, 0.5, 0.5],  	// raw adsr as given by knobs
		adsr_delta: [0.3, 0.3, -0.3, -0.3],	// difference between first and last adsr
		adsr_bps: [[]],					 	// adsr as a list of list [[x y x y x y ...], [...], ...]
				 
		breakpoints: [{					
			N: 4,
			xs: [0, 0, 100, 100], // times [ms]
			ys: [0, 1, 1, 0],     // values
		}],
		
		is_note_on: false,
		notes_p: [],
		notes_v: [],
				
		nb_harmonics: 4,
		ol: {
			"any": 0,		
			"adsr_bps": 1,
			"cycles": 2,			
			"lines": 3,
		}
	}; 

function clip(min, max, val){
	return Math.min(max, Math.max(min, val));
}

function log(msg){
	post(msg);
	post("\n");
}

function update_adsr_bps(){
	const attack_max = 200;
	const decay_max = 500;
	const release_range = 300;

	Nh = ctx.nb_harmonics;
	for (k = 0; k < Nh; k++) {
		const adsr = [];
		adsr_bps = [];
		for (i = 0; i < 4; i++) {
			delta = 2*ctx.adsr_delta[i] - 1
			adsr[i] = clip(0, 1, ctx.adsr_raw[i] + delta*k/Nh);
		}

		const a_x = attack_max*adsr[0];
		const d_x = a_x + decay_max*adsr[1];
		const s_x = attack_max + decay_max;
		const s_y = 1*adsr[2];
		const r_x = s_x + release_range*adsr[3];
		
		
		adsr_bps[0] = 0;
		adsr_bps[1] = 0;
		
		adsr_bps[2] = a_x;
		adsr_bps[3] = 1;
		
		adsr_bps[4] = d_x;
		adsr_bps[5] = s_y;
		
		adsr_bps[6] = s_x;
		adsr_bps[7] = s_y;
		
		adsr_bps[8] = r_x;
		adsr_bps[9] = 0;

		ctx.adsr_bps[k] = adsr_bps;
	}
}

function update_breakpoints(){
	Nh = ctx.nb_harmonics;
	for (k = 0; k < ctx.nb_harmonics; k++) {
		harm = k+1;

		bps = ctx.adsr_bps[k];

		const N2 = bps.length;
		xs = [];
		ys = [];
		for (i = 0; i < N2; i+=2) {
			xs.push(bps[i]);
			ys.push(bps[i+1]);
		}
		breakpoint = {
			N: N2/2,
			xs: xs,
			ys: ys,
		}
		ctx.breakpoints[k] = breakpoint;
	}
}


function outlet_adsr_bps()
{
	for (k = 0; k < ctx.nb_harmonics; k++) {
		harm = k+1;
		outlet(ctx.ol["adsr_bps"], "target", harm);
		outlet(ctx.ol["adsr_bps"], "set", ctx.adsr_bps[k]);
	}
	outlet(ctx.ol["adsr_bps"], "target", 1);
}

function outlet_lines(velocity){
	// multiply enveloppes by velocity and send them to mc.line~
	const Nh = ctx.nb_harmonics;
	const amp = velocity/127.0;
	outs = [];

	// for each harmonic
	for (k = 0; k < Nh; k++) {
		harm = k+1;
		breakpoint = ctx.breakpoints[k];
		Nb = breakpoint.N;
		
		// for each break point, compute time difference with previous breakpoint
		delta_times = [breakpoint.xs[0]];
		for (i = 1; i < Nb; i++) {
			delta_times.push(breakpoint.xs[i]-breakpoint.xs[i-1]);
		}

		// multiply value of each breakpoint by amplitude
		values = [];
		for (i = 0; i < Nb; i++) {
			values.push(breakpoint.ys[i]*amp);
		}

		// redefine starting point
		val0 = 0;
		if (delta_times[0] == 0) { 
			delta_times.shift();
			val0 = values.shift();
			Nb--;
		}	

		// fill 2d array of outputs
		out = [];
		for (i = 0; i < Nb; i++) {
			out.push(values[i]/harm);
			out.push(delta_times[i]); 
		}
		outs.push(out);
	}

	// send output for each harmonic
	for (k = 0; k < Nh; k++) {
		harm = k+1;
		outlet(ctx.ol["lines"], "target", harm);
		outlet(ctx.ol["lines"], outs[k]);
	}
}

function process_adsr_msg(adsr_msg){
	ind = adsr_msg[0];
	val = adsr_msg[1];
	ctx.adsr_raw[ind] = val;
	update_adsr_bps();
	update_breakpoints();
	
	outlet_adsr_bps();
}

function process_adsrdelta_msg(adsrdelta_msg){
	ind = adsrdelta_msg[0];
	val = adsrdelta_msg[1];
	ctx.adsr_delta[ind] = val;
	update_adsr_bps();
	update_breakpoints();
	
	outlet_adsr_bps();
}

function append_note(pitch, velocity){
	ctx.notes_p.push(pitch);
	ctx.notes_v.push(velocity);
}
function remove_note(index){
	ctx.notes_p.splice(index, 1);
	ctx.notes_v.splice(index, 1);
}

function mtof(p){
	return 440*Math.pow(2, (p-69.)/12.);
}

function process_notein_msg(midievent_msg){
	//post("\nprocess_notein_msg: \n");
	const pitch = midievent_msg[0];
	const velocity = midievent_msg[1];
	const channel = midievent_msg[2];
	
	len = ctx.notes_p.length;
	const current_pitch = ctx.notes_p[len-1];
	
	
	// remove if already exist
	const ind = ctx.notes_p.indexOf(pitch);
	if (ind > -1) {
		remove_note(ind)
	}
	
	// push if note on
	if (velocity > 0) {
		append_note(pitch, velocity)
	}
	
	//post("notes 1: " + ctx.notes_p + "\n");
	
	// quit of note list is empty
	len = ctx.notes_p.length;
	if (len == 0){
		return;
	}
	// trigger note if new != current
	const new_pitch = ctx.notes_p[len-1];
	if (new_pitch !== current_pitch) {
		const new_velocity = ctx.notes_v[len-1];
		freq = mtof(new_pitch);
		
		
		// must set all cycles and lines
		outlet_lines(new_velocity);
		for (i = 1; i <= ctx.nb_harmonics; i++) {
			outlet(ctx.ol["cycles"], "target", i);
			outlet(ctx.ol["cycles"], freq*i);
		}
	}
}

function process_chans_msg(val)
{
	ctx.nb_harmonics = val;
	init_env_gui();
	update_adsr_bps();
	update_breakpoints();
	
	outlet_adsr_bps();
}

function bang()
{
	outlet(ctx.ol["any"],"myvalue","is", myval);
}

function msg_int(v)
{
	post("received int " + v + "\n");
	myval = v;
	bang();
}

function msg_float(v)
{
	post("received float " + v + "\n");
	myval = v;
	bang();
}

function list()
{
	var a = arrayfromargs(arguments);
	post("received list " + a + "\n");
	myval = a;
	bang();
}

function anything()
{
	var msg = arrayfromargs(messagename, arguments);
	
	
	//post("MSG: " + msg + "\n");
	var cmd = msg.shift();
	switch (cmd) {
  		case 'ADSR':
			process_adsr_msg(msg);
    		break;
		case 'ADSRDelta':
			process_adsrdelta_msg(msg);
			break;
		case 'notein':
			process_notein_msg(msg);
			break;
		case 'chans':
			process_chans_msg(msg);
			break;
  	default:
    	post("UNKNOWN cmd: "+ cmd + " " + msg + "\n");
		bang();
	}
}


function init_env_gui(){
	const Nh = ctx.nb_harmonics;
	outlet(ctx.ol["adsr_bps"], "chans", Nh);

	// for each harmonic
	for (k = 0; k < Nh; k++) {
		harm = k+1
		outlet(ctx.ol["adsr_bps"], "target", harm);
		outlet(ctx.ol["adsr_bps"], "clear");
		for (i = 0; i < 5; i++) {
			outlet(ctx.ol["adsr_bps"], 1, 2);
		}
	}
}


function initialize()
{
	post("I  N  I  T");
	
	Object.size = function(obj) {
		var size = 0,
			key;
  		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
  		}
  			return size;
	};
	outlets = Object.size(ctx.ol);
	
	init_env_gui();

	update_adsr_bps();
	update_breakpoints(); 
	
	
	outlet_adsr_bps();
	
	post("I  A  L  I  Z  E\n");
}

initialize();

//if (jsarguments.length>1)
//	myval = jsarguments[1];
	
