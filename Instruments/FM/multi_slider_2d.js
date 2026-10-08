/*

2d slider: one draggable circle on a black background.
Outputs "x y" normalized to 0-1, (0,0) = top left, (1,1) = bottom right.

arguments: circlered circlegreen circleblue (0-255, default white)

*/

inlets = 1;
outlets = 1;

sketch.default2d();
sketch.fsaa = 1;

var RADIUS = 0.1; // circle radius in world units (view height spans 2)
var nx = 0.5;
var ny = 0.5;
var hover = false;
var dragging = false;
var grab_dx = 0; // pixel offset between mouse and circle center at click
var grab_dy = 0;
var vcolor = [1., 1., 1., 1.];

if (jsarguments.length > 3) {
	vcolor = [jsarguments[1] / 255., jsarguments[2] / 255., jsarguments[3] / 255., 1.];
}

draw();

function clamp01(v)
{
	return Math.min(Math.max(0, v), 1);
}

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function draw()
{
	var s = size();
	var aspect = s[0] / s[1];

	with (sketch) {
		shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
		glcolor(vcolor);
		gllinewidth(2);
		moveto((nx * 2 - 1) * aspect, 1 - ny * 2);
		if (hover || dragging)
			circle(RADIUS);
		else
			framecircle(RADIUS);
	}
}

function bang()
{
	draw();
	refresh();
	outlet(0, nx, ny);
}

// set x and y without output
function set(x, y)
{
	nx = clamp01(x);
	ny = clamp01(y);
	notifyclients();
	draw();
	refresh();
}

function list(x, y)
{
	set(x, y);
	outlet(0, nx, ny);
}

function setvalueof(x, y)
{
	set(x, y);
	outlet(0, nx, ny);
}

function getvalueof()
{
	return [nx, ny];
}

function colour(r, g, b)
{
	vcolor = [r / 255., g / 255., b / 255., 1.];
	draw();
	refresh();
}

function fsaa(v)
{
	sketch.fsaa = v;
	bang();
}

function hit(x, y)
{
	var s = size();
	var dx = x - nx * s[0];
	var dy = y - ny * s[1];
	var r = RADIUS * s[1] / 2;
	return dx * dx + dy * dy <= r * r;
}

// mouse events: x, y are in pixels, (0,0) top left
function onidle(x, y)
{
	var h = hit(x, y);
	if (h != hover) {
		hover = h;
		draw();
		refresh();
	}
}
onidle.local = 1;

function onidleout()
{
	if (hover) {
		hover = false;
		draw();
		refresh();
	}
}
onidleout.local = 1;

function onclick(x, y)
{
	var s = size();
	dragging = hit(x, y);
	if (dragging) {
		grab_dx = nx * s[0] - x;
		grab_dy = ny * s[1] - y;
		draw();
		refresh();
	}
}
onclick.local = 1;

function ondrag(x, y, but)
{
	var s = size();
	if (!but) {
		dragging = false;
		hover = hit(x, y);
		draw();
		refresh();
		return;
	}
	if (!dragging)
		return;
	nx = clamp01((x + grab_dx) / s[0]);
	ny = clamp01((y + grab_dy) / s[1]);
	notifyclients();
	bang();
}
ondrag.local = 1;

function onresize(w, h)
{
	draw();
	refresh();
}
onresize.local = 1;
