sketch.default2d();

var ctx = {
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
