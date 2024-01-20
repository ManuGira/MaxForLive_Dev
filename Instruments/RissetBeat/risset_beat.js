sketch.default2d();

// context
var ctx = {
	initialized: false,
	// outlets positions
	ol: {
		"my first outlet 1": 0,
		"another outlet": 1,
	},
    rgba:{// ableton 10 theme colors
		dark_gray: [40/255,  40/255,  40/255, 1],
		gray: [127/255,  127/255,  127/255, 1],
		orange: [255/255, 181/255, 150/255, 1],
		blue: [109/255, 215/255, 255/255, 1],
		red: [230/255, 30/255, 100/255, 1],
	},
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


function draw(){
	with (sketch) {
		glclearcolor(ctx.rgba.dark_gray);
		glcolor(ctx.rgba.blue);
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


function outlet_myfistoutlet(){
	outlet(ctx.ol["my first outlet"], "blablabla");
}

// just an example of how to use outlets
function outlet_anotheroutlet(){
	outlet(ctx.ol["another outlet"], "blabliblou");
}

function bang(){
	if (!ctx.initialized){
		return;
	}
	log("bang")
}

function anything(){
	var msg = arrayfromargs(messagename, arguments);

	var cmd = msg.shift();
	log("anything(): received command:", cmd);
	if (cmd == "init"){
		initialize();
		return;
	}
	
	if (!ctx.initialized){
		return;
	}
	switch (cmd) {
		case 'my_fist_command':
			outlet_myfistoutlet();
			break;
		case 'another_command':
			outlet_anotheroutlet();
			break;
  	default:
    	post("UNKNOWN cmd (anything): "+ cmd + " " + msg + "\n");
		//bang();
	}
}


function initialize(){
	log("\nS T A R T initialize");
	ctx.initialized = true;
    draw()
	log("E N D initialize\n");
}

initialize()