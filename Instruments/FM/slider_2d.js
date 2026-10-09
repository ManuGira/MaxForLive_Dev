/*

2d slider: one draggable point on a black background.
Outputs "x y" normalized to 0-1 over the travel range, (0,0) = top left, (1,1) = bottom right.

messages:
	list x y           set position (0-1) and output
	set x y            set position, no output
	bang               output position
	colour r g b       color (0-255)

*/

inlets = 1;
outlets = 1;

include("point.js");
include("colors.js");

sketch.default2d();
sketch.fsaa = 1;

var MINX = 0.025; // travel range, normalized to view size
var MAXX = 0.975;
var MINY = 0.025;
var MAXY = 0.975;

Point.DEFAULT_COLOR = Colors.BLUE;

var handle = new Point(0.5, 0.5);
handle.setLimits(MINX, MINY, MAXX, MAXY);

var hover = false;
var dragging = false;
var grab_dx = 0; // pixel offset between mouse and handle center at click
var grab_dy = 0;

draw();

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function valuex()
{
	return (handle.x - MINX) / (MAXX - MINX);
}

function valuey()
{
	return (handle.y - MINY) / (MAXY - MINY);
}

function draw()
{
	var s = size();

	with (sketch) {
		shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
	}
	handle.draw(s, hover || dragging);
}

function redraw()
{
	draw();
	refresh();
}

function output()
{
	outlet(0, valuex(), valuey());
}

function bang()
{
	redraw();
	output();
}

function clamp01(v)
{
	return Math.min(Math.max(0, v), 1);
}

function set(x, y)
{
	handle.move(MINX + clamp01(x) * (MAXX - MINX), MINY + clamp01(y) * (MAXY - MINY));
	notifyclients();
	redraw();
}

function list(x, y)
{
	set(x, y);
	output();
}

function setvalueof(x, y)
{
	list(x, y);
}

function getvalueof()
{
	return [valuex(), valuey()];
}

function colour(r, g, b)
{
	handle.color = [r / 255., g / 255., b / 255., 1.];
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
		grab_dy = handle.y * s[1] - y;
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
	handle.move((x + grab_dx) / s[0], (y + grab_dy) / s[1]);
	notifyclients();
	redraw();
	output();
}
ondrag.local = 1;

function onresize(w, h)
{
	redraw();
}
onresize.local = 1;
