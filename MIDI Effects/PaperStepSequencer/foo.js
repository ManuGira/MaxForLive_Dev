inlets = 1;
outlets = 2;
vg = 0;

var myVal=0;
if (jsarguments.length>1)
	myval = jsarguments[1];

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



function msg_int(v)
{
	//post("received midi note " + v + "\n");
	octave = (v-69)/12;
	freq = 440 * Math.pow(2, octave); 
	//log("freq: ", freq, " Hz");
	period_ms = 1000/freq;
	//log("period: ", period_ms, " ms");
	outlet(0, freq);
	outlet(1, period_ms);
}

function anything(v)
{
	var a = arrayfromargs(messagename, arguments);
	post("received message " + a + "\n");
	myval = a;
}