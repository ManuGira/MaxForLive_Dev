
// context
var ctx = {
	initialized: false,
	// outlets positions
	ol: {
		"my first outlet 1": 0,
		"another outlet": 1,
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
	log("E N D initialize\n");
}

initialize()