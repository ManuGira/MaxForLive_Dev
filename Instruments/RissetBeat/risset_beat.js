sketch.default2d();

var static_cfg = {
	// outlets positions
	ol: {
		"pos": 0,
		"vel": 1,
		"acc": 2,
	},
    rgba:{// ableton 10 theme colors
		dark_gray: [40/255,  40/255,  40/255, 1],
		gray: [127/255,  127/255,  127/255, 1],
		orange: [255/255, 181/255, 150/255, 1],
		blue: [109/255, 215/255, 255/255, 1],
		red: [230/255, 30/255, 100/255, 1],
	},	
}; 

// user inputs
var cfg = {
	octaves: 1,
	beats: 1,
	bpm: 120,
	dt: 0.05,
};


var state = {
	initialized: false,
	acc: 0.0,
	vel: 1.0,
	pos: 0.0,
}

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

function outlet_pos(pos){outlet(static_cfg.ol["pos"], pos)}
function outlet_vel(vel){outlet(static_cfg.ol["vel"], vel)}
function outlet_acc(acc){outlet(static_cfg.ol["acc"], acc)}

function outlet_all(){
	outlet_pos(state.pos)
	outlet_vel(state.vel)
	outlet_acc(state.acc)
}

function update(){
	period = 60./cfg.bpm

	state.acc = cfg.octaves * period/cfg.beats  // [oct/s^2]
	state.vel = state.vel * Math.pow(2.0, cfg.dt*state.acc)  // [s'/s]  second read per second
	state.pos = state.pos + state.vel*cfg.dt  // [s']
	log(state.vel)
}

function draw(){
	with (sketch) {
		glclearcolor(static_cfg.rgba.dark_gray);
		glcolor(static_cfg.rgba.blue);
		glclear();

		refresh();
	}
}

function onidle(x, y, button, cmd, shift, capslock, alt, ctrl){
    log("onidle", x, y, button, cmd, shift, capslock, alt, ctrl)
	draw();
}

function onidleout(x, y, button, cmd, shift, capslock, alt, ctrl){
    log("onidleout", x, y, button, cmd, shift, capslock, alt, ctrl)
	draw();
}

function onclick(x, y, button, cmd, shift, capslock, alt, ctrl){
    log("onclick", x, y, button, cmd, shift, capslock, alt, ctrl)
	draw();
}

function ondrag(x, y, button, cmd, shift, capslock, alt, ctrl){
	log("ondrag", x, y, button, cmd, shift, capslock, alt, ctrl)
	draw();
}

function bang(){
	log("bang", state.initialized)
	if (!state.initialized){
		return;
	}
	log("bang")
	update()
	outlet_all()
	draw()
}

function process_msg_octaves(octaves){
	log("process_msg_octaves(octaves)", octaves)
	cfg.octaves = octaves
}
function process_msg_bars(beats){
	log("process_msg_octaves(beats)", beats)
	cfg.beats = beats
}
function process_msg_bpm(bpm){
	log("process_msg_octaves(bpm)", bpm)
	cfg.bpm = bpm
}
function process_msg_dt(dt){
	log("process_msg_octaves(dt)", dt)
	cfg.dt = dt
}

function anything(){
	var msg = arrayfromargs(messagename, arguments);

	var cmd = msg.shift();
	log("anything(): received command:", cmd);
	if (cmd == "init"){
		initialize();
		return;
	}


	switch (cmd) {
		case 'octaves':
			process_msg_octaves(msg);
			break;
		case 'beats':
			process_msg_bars(msg);
			break;
		case 'bpm':
			process_msg_bpm(msg);
			break;
		case 'dt':
			process_msg_dt(msg);
			break;
  	default:
    	post("UNKNOWN cmd (anything): "+ cmd + " " + msg + "\n");
		//bang();
	}

	
	if (!state.initialized){
		return;
	}
}


function initialize(){
	log("\nS T A R T initialize")
	state.initialized = true
	state.vel = 1.0
    draw()
	log("E N D initialize\n")
}

// create a size function for objects (counting number of keys). What's difference with len?
Object.size = function(obj) {
	var size = 0, key
	  for (key in obj) {
		if (obj.hasOwnProperty(key)) size++
	  }
	  return size
}
outlets = Object.size(static_cfg.ol)