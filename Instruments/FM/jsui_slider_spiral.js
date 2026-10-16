/*

6 draggable points sharing the same spiral, centered in the view, on a black background, one
color each. Each point comes with its set of lines (see SpiralPoint).
Outputs "i t": the point index 0-5 and t, its position along the spiral: number of turns * TURN
(12 per turn), from 0 at the center to TMAX at the outer end. It is not normalized to 0-1.
The points are always constrained on the spiral.

spiral: angle(t) = 2*pi*t/TURN, radius(t) = t, clockwise from the top. The spiral is scaled to the
view size so that it always fits (see the spaces below).

messages:
	list i t           set point i position t and output
	set i t            set point i position t, no output
	visible i v        show (1) or hide (0) point i; a hidden point can't be dragged
	bang               output every point
	colour r g b       color for the spiral and all the points (0-255)

*/

include("_widget.js");
include("_colors.js");
include("_coprimes.js");

var TURN = 12; // units of t for one full turn
var TMAX = 127; // t at the outer end of the spiral
var MARGIN = 5; // pixels kept free between the spiral end and the view edge
var STEPS = TMAX; // samples used to draw the spiral
var REFINE = TURN / 4; // search half-width around the analytic estimate, in t
var RAD_PER_PITCH = 2 * Math.PI / TURN;


function clamp(v, lo, hi)
{
	return Math.min(Math.max(lo, v), hi);
}

/*
Spaces:
	pixel space   the GUI in pixels as displayed, (0,0) top left, x right, y down
	spiral space  origin at the spiral center, x right, y up, ranging from -A*TMAX to A*TMAX
	              (with A = 1 the turns are spaced by 12); spiral(t) = A*t*(cos a, sin a), a = 2*pi*t/TURN
	pitch space   1d position t along the spiral, ranging from 0 to TMAX
*/

// pixels per unit of spiral space so that the spiral end fits the view of size s
function pixelsPerUnit(s)
{
	var minSide = Math.min(s[0], s[1]);
	return Math.max(0, minSide / 2 - MARGIN) / TMAX;
}

function pitch2Rad(pitch){
	return Math.PI/2 - pitch * RAD_PER_PITCH;
}

function rad2Pitch(rad){
	return (Math.PI/2 - rad) / RAD_PER_PITCH;
}

// pitch space -> spiral space: [dx, dy]
function pitch2Spiral(pitch)
{
	var rad = pitch2Rad(pitch);
	return [pitch * Math.cos(rad), pitch * Math.sin(rad)];
}

// spiral space -> pitch space: t in [0, TMAX] of the spiral point nearest to (dx, dy).
// The angle phi of (dx, dy) gives the spiral points at that angle, one per turn; the turn
// index is found from the radius gap; the neighbouring turns are refined locally and the closest
// is kept.
function spiral2Pitch(dx, dy)
{
	var rad = Math.atan2(dy, dx); // inverse of the spiral angle, in (-pi, pi]
	const pitch0 = rad2Pitch(rad);
	var radius = Math.sqrt(dx * dx + dy * dy);

	// midi pitch of the lower C note
	var pitch_c = radius-pitch0;
	var r0 = Math.round((pitch_c)/TURN)*TURN + pitch0;
	

	if (r0 > TMAX){
		r0 = r0 - Math.ceil((r0-TMAX)/TURN)*TURN;
	}

	return r0;
}

// spiral space -> pixel space (current view size): [x, y]
function spiral2Pixel(dx, dy)
{
	var s = Math.min(size()[0], size()[1]);
	var k = pixelsPerUnit([s, s]);
	return [s / 2 + dx * k, s / 2 - dy * k];
}

// pixel space -> spiral space (current view size): [dx, dy]
function pixel2Spiral(x, y)
{
	var s = Math.min(size()[0], size()[1]);
	var k = pixelsPerUnit([s, s]);
	return k > 0 ? [(x - s / 2) / k, (s / 2 - y) / k] : [0, 0];
}

var spiral = {
	points: [], // not draggable
	color: Colors.DARK_GRAY.slice(),

	setColor: function(c)
	{
		this.color = c.slice();
	},

	draw: function(s)
	{
		var i, p, q;
		var c = this.color.slice();
		with (sketch) {
			glcolor(c);
			gllinewidth(1);
			for (i = 0; i <= STEPS; i++) {
				p = pitch2Spiral(TMAX * i / STEPS);
				q = spiral2Pixel(p[0], p[1]);
				// pixels to world coordinates (view height spans 2 units)
				if (i == 0)
					moveto((q[0] * 2 - s[0]) / s[1], 1 - q[1] * 2 / s[1]);
				else
					lineto((q[0] * 2 - s[0]) / s[1], 1 - q[1] * 2 / s[1]);
			}
		}
	}
};
widget.add(spiral);

var HARMONICITY_THRESHOLD = -7; // lowest harmonicity kept; ratios range from this (alpha 0) to 0 (alpha 1)

// Simple ratios [h, i, j], shared by all the points: one line per ratio, with the angle of the
// ratio i/j (log2(i/j) turns) relative to the point and an alpha given by the harmonicity h.
var RATIOS = generate_simple_ratios(HARMONICITY_THRESHOLD);
var ALPHAS = RATIOS.map(function(r) {
    return clamp(1 - r[0] / HARMONICITY_THRESHOLD, 0, 1);
});
var RADIANS = RATIOS.map(function(r) {
    return pitch2Rad(TURN * Math.log(r[1] / r[2]) / Math.log(2));
});

// Point constrained on the spiral, drawn with its set of lines: the lines start at the center and
// are rotated so that the strongest one (ratio 1/1) passes through the point.
function SpiralPoint(t)
{
	Point.call(this, 0.5, 0.5);
	this.t = t !== undefined ? t : 0; // position along the spiral: turns * TURN
	this.radius = 4;
}
SpiralPoint.prototype = Object.create(Point.prototype);
SpiralPoint.prototype.constructor = SpiralPoint;

// moves the point to the spiral position of the current t for a view of size s
// (drawn at the end of the spiral if t is beyond it, the value is kept)
SpiralPoint.prototype.place = function(s)
{
	var p = pitch2Spiral(Math.min(this.t, TMAX));
	var q = spiral2Pixel(p[0], p[1]);
	this.x = q[0] / s[0];
	this.y = q[1] / s[1];
};

// x, y are normalized to the view size: the point goes to the nearest spiral point
SpiralPoint.prototype.move = function(x, y)
{
	var s = size();
	var p = pixel2Spiral(x * s[0], y * s[1]);
	this.t = spiral2Pitch(p[0], p[1]);
	this.place(s);
};

SpiralPoint.prototype.drawLines = function(s)
{
	var k, rad, q;
	var offset = pitch2Rad(this.t) - pitch2Rad(0);
	var o = spiral2Pixel(0, 0);
	var c = this.color.slice();
	with (sketch) {
		gllinewidth(1);
		for (k = 0; k < RATIOS.length; k++) {
			// harmonicity from HARMONICITY_THRESHOLD..0 remapped to alpha 0..1
			c[3] = ALPHAS[k];
			glcolor(c);
			rad = offset + RADIANS[k];
			q = spiral2Pixel(TMAX * Math.cos(rad), TMAX * Math.sin(rad));
			moveto((o[0] * 2 - s[0]) / s[1], 1 - o[1] * 2 / s[1]);
			lineto((q[0] * 2 - s[0]) / s[1], 1 - q[1] * 2 / s[1]);
		}
	}
};

// the spiral depends on the view size: keep the point on it after a resize
SpiralPoint.prototype.draw = function(s, filled)
{
	this.place(s);
	if (!this.visible)
		return;
	this.drawLines(s);
	Point.prototype.draw.call(this, s, filled);
};

var COLORS = [Colors.RED, Colors.GREEN, Colors.BLUE, Colors.CYAN, Colors.MAGENTA, Colors.YELLOW];
var sliders = [];

(function() {
	var i, p;
	for (i = 0; i < COLORS.length; i++) {
		p = new SpiralPoint(36 + 7 * i);
		p.setColor(COLORS[i]);
		sliders.push(p);
		widget.add(p);
	}
})();

function output(i)
{
	outlet(0, i, sliders[i].t);
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

function set(i, t)
{
	if (i < 0 || i >= sliders.length)
		return false;
	sliders[i].t = clamp(t, 0, TMAX);
	sliders[i].place(size());
	widget.changed();
	return true;
}

// same as dragging point i: update, notify the clients once, then output i once
function list(i, t)
{
	if (set(i, t))
		output(i);
}

// pattr state: t0 t1 t2 ...
// Only the points whose value changes are output: notifyclients() (called by widget.changed()
// after every drag or set) can make the host send back the current state, which must not
// output every point again.
function setvalueof()
{
	var i, t;
	var changed = [];
	for (i = 0; i < sliders.length && i < arguments.length; i++) {
		t = clamp(arguments[i], 0, TMAX);
		if (t !== sliders[i].t) {
			sliders[i].t = t;
			changed.push(i);
		}
	}
	if (changed.length == 0)
		return;
	widget.changed();
	for (i = 0; i < changed.length; i++)
		output(changed[i]);
}


function getvalueof()
{
	return sliders.map(function(p) { return p.t; });
}
