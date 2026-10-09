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

inlets = 1;
outlets = 1;

include("point.js");
include("poly_line.js");
include("colors.js");

sketch.default2d();
sketch.fsaa = 1;

var MINX = 0.025; // track ends, normalized to view width
var MAXX = 0.975;
var Y = 0.5;

Point.DEFAULT_COLOR = Colors.BLUE;

var handle = new Point(0.5, Y);
handle.setLimits(MINX, Y, MAXX, Y);

var track = new PolyLine([new Point(MINX, Y), new Point(MAXX, Y)]);
track.points[0].visible = false;
track.points[1].visible = false;
track.enabled = false; // draws the line at half alpha

var hover = false;
var dragging = false;
var grab_dx = 0; // pixel offset between mouse and handle center at click

draw();

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function value()
{
	return (handle.x - MINX) / (MAXX - MINX);
}

function draw()
{
	var s = size();

	with (sketch) {
		shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
	}
	track.draw(s);
	handle.draw(s, hover || dragging);
}

function redraw()
{
	draw();
	refresh();
}

function bang()
{
	redraw();
	outlet(0, value());
}

function set(v)
{
	handle.move(MINX + Math.min(Math.max(0, v), 1) * (MAXX - MINX), Y);
	notifyclients();
	redraw();
}

function msg_float(v)
{
	set(v);
	outlet(0, value());
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
	return value();
}

function colour(r, g, b)
{
	var c = [r / 255., g / 255., b / 255., 1.];
	Point.DEFAULT_COLOR = c;
	handle.color = c.slice();
	track.setColor(c);
	redraw();
}

function fsaa(v)
{
	sketch.fsaa = v;
	redraw();
}

// mouse events: x, y are in pixels, (0,0) top left
function onidle(x, y)
{
	var h = handle.hit(x, y, size());
	if (h != hover) {
		hover = h;
		redraw();
	}
}
onidle.local = 1;

function onidleout()
{
	if (hover) {
		hover = false;
		redraw();
	}
}
onidleout.local = 1;

function onclick(x, y)
{
	var s = size();
	dragging = handle.hit(x, y, s);
	if (dragging) {
		grab_dx = handle.x * s[0] - x;
		redraw();
	}
}
onclick.local = 1;

function ondrag(x, y, but)
{
	var s = size();
	if (!but) {
		dragging = false;
		hover = handle.hit(x, y, s);
		redraw();
		return;
	}
	if (!dragging)
		return;
	handle.move((x + grab_dx) / s[0], Y);
	notifyclients();
	redraw();
	outlet(0, value());
}
ondrag.local = 1;

function onresize(w, h)
{
	redraw();
}
onresize.local = 1;
