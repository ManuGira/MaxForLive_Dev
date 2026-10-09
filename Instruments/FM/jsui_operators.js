/*

6 draggable 2d sliders sharing the same area, one color each.
Outputs "i x y" with x, y normalized to 0-1 over the travel range, (0,0) = top left.

messages:
	visible i v        show (1) or hide (0) slider i, 0-5; a hidden slider can't be dragged
	list i x y         set slider i position (0-1) and output
	set i x y          set slider i position, no output
	bang               output every slider
	colour r g b       color for all sliders (0-255)

*/
include("_widget.js");

var COLORS = [Colors.RED, Colors.GREEN, Colors.BLUE, Colors.CYAN, Colors.MAGENTA, Colors.YELLOW];
var sliders = [];

(function() {
	var i, p;
	for (i = 0; i < COLORS.length; i++) {
		p = new Point((i + 0.5) / COLORS.length, 0.5);
		p.setLimits(0.025, 0.025, 0.975, 0.975); // travel range, normalized to view size
		p.setColor(COLORS[i]);
		sliders.push(p);
		widget.add(p);
	}
})();

function scaleDepthOut(depth01)
{
	return (1.0-depth01) * 127 - 64;
}

function scalePitchOut(pitch01)
{
	return pitch01 * 127 - 64;
}

function scaleDepthIn(depth)
{
	return 1.0 - (depth + 64) / 127;
}

function scalePitchIn(pitch)
{
	return (pitch + 64) / 127;
}

function output(i)
{
    // scale output from 0-1 to -64 to 63
	outlet(0, i, scalePitchOut(sliders[i].valueX()), scaleDepthOut(sliders[i].valueY()));
}

widget.output = function(p) {
	var i;
	if (p) {
		output(sliders.indexOf(p));
		return;
	}
	for (i = 0; i < sliders.length; i++)
		output(i);
};

function visible(i, v)
{
	if (i < 0 || i >= sliders.length)
		return;
	sliders[i].visible = v != 0;
	widget.changed();
}

function set(i, x, y)
{
    pitch01 = scalePitchIn(x);
    depth01 = scaleDepthIn(y);
	if (i < 0 || i >= sliders.length)
		return;
	sliders[i].setValue(pitch01, depth01);
	widget.changed();
}

function list(i, x, y)
{
	set(i, x, y);
	if (i >= 0 && i < sliders.length)
		output(i);
}

// pattr state: x0 y0 x1 y1 ...
function setvalueof()
{
	var i;
	for (i = 0; i < sliders.length && 2 * i + 1 < arguments.length; i++)
		sliders[i].setValue(arguments[2 * i], arguments[2 * i + 1]);
	widget.changed();
	widget.output();
}

function getvalueof()
{
	var v = [];
	var i;
	for (i = 0; i < sliders.length; i++)
		v.push(sliders[i].valueX(), sliders[i].valueY());
	return v;
}
