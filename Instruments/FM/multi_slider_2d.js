/*

2d slider with a list of draggable points on a black background.
Outputs "index x y" with x, y normalized to 0-1, (0,0) = top left, (1,1) = bottom right.

messages:
	add x y            append a point
	remove i           remove point i
	clear              remove all points
	set i x y          move point i, no output
	list i x y         move point i and output
	colour r g b       circle colour (0-255)
	bang               output every point

arguments: circlered circlegreen circleblue (0-255, default white)

*/

inlets = 1;
outlets = 1;

sketch.default2d();
sketch.fsaa = 1;

var RADIUS = 0.1; // circle radius in world units (view height spans 2)
var points = [];
var hovered = -1; // index of hovered point
var dragged = -1; // index of dragged point
var grab_dx = 0; // pixel offset between mouse and circle center at click
var grab_dy = 0;
var vcolor = [1., 1., 1., 1.];

if (jsarguments.length > 3) {
	vcolor = [jsarguments[1] / 255., jsarguments[2] / 255., jsarguments[3] / 255., 1.];
}

function clamp01(v)
{
	return Math.min(Math.max(0, v), 1);
}

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function Point(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
}

Point.prototype.move = function(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
};

Point.prototype.hit = function(px, py, s)
{
	var dx = px - this.x * s[0];
	var dy = py - this.y * s[1];
	var r = RADIUS * s[1] / 2;
	return dx * dx + dy * dy <= r * r;
};

Point.prototype.draw = function(aspect, filled)
{
	with (sketch) {
		moveto((this.x * 2 - 1) * aspect, 1 - this.y * 2);
		if (filled)
			circle(RADIUS);
		else
			framecircle(RADIUS);
	}
};

points.push(new Point(0.5, 0.5));
points.push(new Point(0.25, 0.25));
draw();

function draw()
{
	var s = size();
	var aspect = s[0] / s[1];
	var i;

	with (sketch) {
		shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
		glcolor(vcolor);
		gllinewidth(2);
	}
	for (i = 0; i < points.length; i++)
		points[i].draw(aspect, i == hovered || i == dragged);
}

function redraw()
{
	draw();
	refresh();
}

function output(i)
{
	outlet(0, i, points[i].x, points[i].y);
}

function bang()
{
	var i;
	redraw();
	for (i = 0; i < points.length; i++)
		output(i);
}

function add(x, y)
{
	points.push(new Point(x, y));
	notifyclients();
	redraw();
}

function remove(i)
{
	if (i < 0 || i >= points.length)
		return;
	points.splice(i, 1);
	hovered = dragged = -1;
	notifyclients();
	redraw();
}

function clear()
{
	points = [];
	hovered = dragged = -1;
	notifyclients();
	redraw();
}

function set(i, x, y)
{
	if (i < 0 || i >= points.length)
		return;
	points[i].move(x, y);
	notifyclients();
	redraw();
}

function list(i, x, y)
{
	set(i, x, y);
	if (i >= 0 && i < points.length)
		output(i);
}

// pattr state: flat x0 y0 x1 y1 ...
function setvalueof()
{
	var i;
	points = [];
	for (i = 0; i + 1 < arguments.length; i += 2)
		points.push(new Point(arguments[i], arguments[i + 1]));
	hovered = dragged = -1;
	notifyclients();
	bang();
}

function getvalueof()
{
	var v = [];
	var i;
	for (i = 0; i < points.length; i++)
		v.push(points[i].x, points[i].y);
	return v;
}

function colour(r, g, b)
{
	vcolor = [r / 255., g / 255., b / 255., 1.];
	redraw();
}

function fsaa(v)
{
	sketch.fsaa = v;
	redraw();
}

// topmost (last drawn) point under the pixel position, or -1
function hitTest(x, y)
{
	var s = size();
	var i;
	for (i = points.length - 1; i >= 0; i--)
		if (points[i].hit(x, y, s))
			return i;
	return -1;
}

// mouse events: x, y are in pixels, (0,0) top left
function onidle(x, y)
{
	var h = hitTest(x, y);
	if (h != hovered) {
		hovered = h;
		redraw();
	}
}
onidle.local = 1;

function onidleout()
{
	if (hovered != -1) {
		hovered = -1;
		redraw();
	}
}
onidleout.local = 1;

function onclick(x, y)
{
	var s = size();
	dragged = hitTest(x, y);
	if (dragged != -1) {
		grab_dx = points[dragged].x * s[0] - x;
		grab_dy = points[dragged].y * s[1] - y;
		redraw();
	}
}
onclick.local = 1;

function ondrag(x, y, but)
{
	var s = size();
	if (!but) {
		dragged = -1;
		hovered = hitTest(x, y);
		redraw();
		return;
	}
	if (dragged == -1)
		return;
	points[dragged].move((x + grab_dx) / s[0], (y + grab_dy) / s[1]);
	notifyclients();
	redraw();
	output(dragged);
}
ondrag.local = 1;

function onresize(w, h)
{
	draw();
	refresh();
}
onresize.local = 1;
