/*

1d horizontal slider: one draggable point on a track, on a black background.
Outputs the slider value normalized to 0-1 (0 = left end of the track, 1 = right end).

messages:
	float / int v      set value (0-1) and output
	set v              set value, no output
	bang               output value
	colour r g b       color (0-255)

arguments: red green blue (0-255, default white)

*/

include("_widget.js");
include("_colors.js");

Point.DEFAULT_COLOR = Colors.RED;

var MINX = 0.025; // track ends, normalized to view width
var MAXX = 0.975;
var Y = 0.5;

var track = new PolyLine([new Point(MINX, Y), new Point(MAXX, Y)]);
track.points[0].visible = false;
track.points[1].visible = false;
// track.enabled = false; // draws the line at half alpha
widget.add(track);

var handle = new Point(0.5, Y);
handle.setLimits(MINX, Y, MAXX, Y);
widget.add(handle);

widget.output = function() {
	outlet(0, handle.valueX());
};

function set(v)
{
	handle.setValue(v, 0);
	widget.changed();
}

function msg_float(v)
{
	set(v);
	widget.output();
}

function msg_int(v)
{
	msg_float(v);
}

function setvalueof(v)
{
	msg_float(v);
}

function getvalueof()
{
	return handle.valueX();
}
