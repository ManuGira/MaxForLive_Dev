var myval=0;
var ctx = {
	// outlets positions
	ol: {
		"matrix": 0
	}
}; 

function loadjsonfile(filename){
	f = new File(filename, "read", []);
	jsonstr = f.readstring(f.eof);
	f.close();
	prs = JSON.parse(jsonstr);
	return prs; 
}

function log(msg){
	post(msg);
	post("\n");
}

function len(obj){
	var N = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) N++;
	}
	return N;
}

function make_matrix_msg(matrix_obj){
	var i;
	msg = ["set"];
	for (i = 0; i < len(matrix_obj); i++) {
		for (j = 0; j < matrix_obj[i].length; j++){
			if (matrix_obj[i][j] == 1) {
				msg = msg.concat([j, i, 1]);
			}
		}
	}
	return msg;
}

function bang(){
	outlet(ctx.ol["matrix"], "clear");

	data = loadjsonfile("data.json");
	matrix_msg = make_matrix_msg(data.grid);

	outlet(ctx.ol["matrix"], matrix_msg);

}

function anything(){
	var msg = arrayfromargs(messagename, arguments);
	
	post("MSG: " + msg + "\n");
	var cmd = msg.shift();
	switch (cmd) {
  		case 'MSG':
			//process_adsr_msg(msg);
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

	bang();
	post("I  A  L  I  Z  E\n");
}
initialize();

//if (jsarguments.length>1)
//	myval = jsarguments[1];
	
