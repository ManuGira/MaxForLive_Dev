/*

2d slider with a 2d list (list of rows) of draggable points on a black background.
Outputs "i j x y" with x, y normalized to 0-1, (0,0) = top left, (1,1) = bottom right.

messages:
	add i x y          append a point to row i (rows are created as needed)
	remove i j         remove point j of row i
	remove i           remove row i
	clear              remove all points
	set i j x y        move point (i, j), no output
	list i j x y       move point (i, j) and output
	colour r g b       circle colour (0-255)
	bang               output every point

arguments: circlered circlegreen circleblue (0-255, default white)

*/

inlets = 1;
outlets = 1;

include("_point.js");
include("_poly_line.js");
include("_colors.js");

sketch.default2d();
sketch.fsaa = 1;

var polylines = []; // polylines[i].points[j]
var hovered = null; // {i, j} of hovered point
var dragged = null; // {i, j} of dragged point
var grab_dx = 0; // pixel offset between mouse and circle center at click
var grab_dy = 0;

if (jsarguments.length > 3) {
	Point.DEFAULT_COLOR = [jsarguments[1] / 255., jsarguments[2] / 255., jsarguments[3] / 255., 1.];
}

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

polylines.push(new PolyLine([new Point(0.5, 0.5), new Point(0.25, 0.25), new Point(0.25, 0.25)]));
polylines[0].setColor(Colors.RED);
polylines.push(new PolyLine([new Point(0.75, 0.5), new Point(0.25, 0.5)]));
polylines[1].setColor(Colors.BLUE);
polylines.push(new PolyLine([new Point(0.75, 0.5), new Point(0.25, 0.5)]));
polylines[2].setColor(Colors.GREEN);
polylines.push(new PolyLine([new Point(0.75, 0.5), new Point(0.25, 0.5)]));
polylines[3].setColor(Colors.MAGENTA);
polylines.push(new PolyLine([new Point(0.75, 0.5), new Point(0.25, 0.5)]));
polylines[4].setColor(Colors.CYAN);
polylines.push(new PolyLine([new Point(0.75, 0.5), new Point(0.25, 0.5)]));
polylines[5].setColor(Colors.YELLOW);
draw();

function same(a, i, j)
{
	return a != null && a.i == i && a.j == j;
}

function valid(i, j)
{
	return i >= 0 && i < polylines.length && j >= 0 && j < polylines[i].points.length;
}

function draw()
{
	var s = size();
	var i;

	with (sketch) {
		// shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
		gllinewidth(2);
	}
	for (i = 0; i < polylines.length; i++)
		polylines[i].draw(s, filledAt(i));
}

function filledAt(i)
{
	return function(j) {
		return same(hovered, i, j) || same(dragged, i, j);
	};
}

function redraw()
{
	draw();
	refresh();
}

function output(i, j)
{
	var p = polylines[i].points[j];
	outlet(0, i, j, p.x, p.y);
}

function bang()
{
	var i, j;
	redraw();
	for (i = 0; i < polylines.length; i++)
		for (j = 0; j < polylines[i].points.length; j++)
			output(i, j);
}

function add(i, x, y)
{
	if (i < 0)
		return;
	while (polylines.length <= i)
		polylines.push(new PolyLine());
	polylines[i].add(x, y);
	notifyclients();
	redraw();
}

function remove(i, j)
{
	if (arguments.length < 2) {
		if (i < 0 || i >= polylines.length)
			return;
		polylines.splice(i, 1);
	} else {
		if (!valid(i, j))
			return;
		polylines[i].remove(j);
	}
	hovered = dragged = null;
	notifyclients();
	redraw();
}

function clear()
{
	polylines = [];
	hovered = dragged = null;
	notifyclients();
	redraw();
}

function set(i, j, x, y)
{
	if (!valid(i, j))
		return;
	polylines[i].points[j].move(x, y);
	notifyclients();
	redraw();
}

function list(i, j, x, y)
{
	set(i, j, x, y);
	if (valid(i, j))
		output(i, j);
}

// pattr state: per row, the point count followed by x y pairs
function setvalueof()
{
	var k = 0;
	var n, m, line;
	polylines = [];
	while (k < arguments.length) {
		n = arguments[k++];
		line = new PolyLine();
		for (m = 0; m < n && k + 1 < arguments.length; m++, k += 2)
			line.add(arguments[k], arguments[k + 1]);
		polylines.push(line);
	}
	hovered = dragged = null;
	notifyclients();
	bang();
}

function getvalueof()
{
	var v = [];
	var i, j, pts;
	for (i = 0; i < polylines.length; i++) {
		pts = polylines[i].points;
		v.push(pts.length);
		for (j = 0; j < pts.length; j++)
			v.push(pts[j].x, pts[j].y);
	}
	return v;
}

function colour(r, g, b)
{
	var i;
	Point.DEFAULT_COLOR = [r / 255., g / 255., b / 255., 1.];
	for (i = 0; i < polylines.length; i++)
		polylines[i].setColor(Point.DEFAULT_COLOR);
	redraw();
}

function fsaa(v)
{
	sketch.fsaa = v;
	redraw();
}

// topmost (last drawn) point under the pixel position as {i, j}, or null
function hitTest(x, y)
{
	var s = size();
	var i, j;
	for (i = polylines.length - 1; i >= 0; i--)
		for (j = polylines[i].points.length - 1; j >= 0; j--)
			if (polylines[i].points[j].hit(x, y, s))
				return {i: i, j: j};
	return null;
}

// mouse events: x, y are in pixels, (0,0) top left
function onidle(x, y)
{
	var h = hitTest(x, y);
	if (h == null ? hovered != null : !same(hovered, h.i, h.j)) {
		hovered = h;
		redraw();
	}
}
onidle.local = 1;

function onidleout()
{
	if (hovered != null) {
		hovered = null;
		redraw();
	}
}
onidleout.local = 1;

function onclick(x, y)
{
	var s = size();
	var p;
	dragged = hitTest(x, y);
	if (dragged != null) {
		p = polylines[dragged.i].points[dragged.j];
		grab_dx = p.x * s[0] - x;
		grab_dy = p.y * s[1] - y;
		redraw();
	}
}
onclick.local = 1;

function ondrag(x, y, but)
{
	var s = size();
	if (!but) {
		dragged = null;
		hovered = hitTest(x, y);
		redraw();
		return;
	}
	if (dragged == null)
		return;
	polylines[dragged.i].points[dragged.j].move((x + grab_dx) / s[0], (y + grab_dy) / s[1]);
	notifyclients();
	redraw();
	output(dragged.i, dragged.j);
}
ondrag.local = 1;

function onresize(w, h)
{
	draw();
	refresh();
}
onresize.local = 1;
