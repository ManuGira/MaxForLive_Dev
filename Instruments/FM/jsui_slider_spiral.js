/*

7 points sharing the same spiral, centered in the view, on a black background, one color each.
Points 0-5 are draggable; point 6 is white and not draggable (moved by messages only).
Each point comes with its set of lines (see SpiralPoint).
Outputs "i t": the point index 0-6 and t, its pitch relative to its reference pitch refPitch
(default 60). The point is on the spiral at the pitch refPitch + t, with refPitch in [0, 127] and
t in [-64, 63]. The spiral covers the pitches from -64 (center) to 190 (outer end), 12 per turn.
t is not normalized to 0-1. The points are always constrained on the spiral.

spiral: angle = angle of the pitch = 2*pi*pitch/TURN, radius = pitch + 64, clockwise from the top.
The spiral is scaled to the view size so that it always fits (see the spaces below).

messages:
	list i t           set point i position t (-64 to 63) and output
	set i t            set point i position t (-64 to 63), no output
	refPitch i pitch   set the reference pitch of point i (0-127), the point keeps its t
	visible i v        show (1) or hide (0) point i; a hidden point can't be dragged
	bang               output every point
	colour r g b       color for the spiral and all the points (0-255)

*/

include("_widget.js");
include("_colors.js");
include("_coprimes.js");

var TURN = 12; // units of pitch for one full turn
var T_MIN = -64; // range of SpiralPoint.t, relative to its refPitch
var T_MAX = 63;
var REF_MIN = 0; // range of SpiralPoint.refPitch
var REF_MAX = 127;
var PITCH_MIN = REF_MIN + T_MIN; // pitch at the center of the spiral
var PITCH_MAX = REF_MAX + T_MAX; // pitch at the outer end of the spiral
var RADIUS_MAX = PITCH_MAX - PITCH_MIN; // spiral radius at the outer end, in spiral space
var MARGIN = 5; // pixels kept free between the spiral end and the view edge
var STEPS = RADIUS_MAX; // samples used to draw the spiral
var RAD_PER_PITCH = 2 * Math.PI / TURN;


function clamp(v, lo, hi)
{
	return Math.min(Math.max(lo, v), hi);
}

/*
Spaces:
	pixel space   the GUI in pixels as displayed, (0,0) top left, x right, y down
	spiral space  origin at the spiral center, x right, y up, ranging from -RADIUS_MAX to RADIUS_MAX;
	              spiral(pitch) = (pitch - PITCH_MIN)*(cos a, sin a), a = angle of the pitch
	pitch space   1d position along the spiral, ranging from PITCH_MIN to PITCH_MAX
*/

// pixels per unit of spiral space so that the spiral end fits the view of size s
function pixelsPerUnit(s)
{
	var minSide = Math.min(s[0], s[1]);
	return Math.max(0, minSide / 2 - MARGIN) / RADIUS_MAX;
}

function pitch2Rad(pitch){
	return Math.PI/2 - pitch * RAD_PER_PITCH;
}

function rad2Pitch(rad){
	return (Math.PI/2 - rad) / RAD_PER_PITCH;
}

// pitch space -> spiral space: [dx, dy]. The radius grows with the pitch from PITCH_MIN.
function pitch2Spiral(pitch)
{
	var rad = pitch2Rad(pitch);
	var radius = pitch - PITCH_MIN;
	return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

// spiral space -> pitch space: pitch in [lo, hi] of the spiral point nearest to (dx, dy).
// lo and hi (a range wider than TURN) default to [PITCH_MIN, PITCH_MAX].
// The angle of (dx, dy) gives the spiral points at that angle, one per turn; the turn nearest
// to the radius is kept, then moved by whole turns into [lo, hi].
function spiral2Pitch(dx, dy, lo, hi)
{
	lo = (lo === undefined) ? PITCH_MIN : lo;
	hi = (hi === undefined) ? PITCH_MAX : hi;
	var rad = Math.atan2(dy, dx); // inverse of the spiral angle, in (-pi, pi]
	var pitch0 = rad2Pitch(rad);
	var radius = Math.sqrt(dx * dx + dy * dy);

	var pitch = Math.round((radius + PITCH_MIN - pitch0) / TURN) * TURN + pitch0;
	if (pitch > hi)
		pitch -= Math.ceil((pitch - hi) / TURN) * TURN;
	else if (pitch < lo)
		pitch += Math.ceil((lo - pitch) / TURN) * TURN;
	return pitch;
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
	color: OperatorColors.DARK_GRAY.slice(),

	setColor: function(c)
	{
		this.color = c.slice();
	},

	draw: function(s)
	{
		var i, p, q;
		var c = this.color.slice();
		c[3] = 0.5; // set alpha to 0.5
		with (sketch) {
			glcolor(c);
			gllinewidth(1);
			for (i = 0; i <= STEPS; i++) {
				p = pitch2Spiral(PITCH_MIN + RADIUS_MAX * i / STEPS);
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

var HARMONICITY_THRESHOLD = -6; // lowest harmonicity kept; ratios range from this (alpha 0) to 0 (alpha 1)

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
// t is the pitch relative to refPitch (so it can be negative): the point is on the spiral at the
// pitch refPitch + t. Dragging keeps t in [T_MIN, T_MAX]; set() can go beyond.
function SpiralPoint(t, refPitch)
{
	Point.call(this, 0.5, 0.5);
	this.refPitch = refPitch !== undefined ? clamp(refPitch, REF_MIN, REF_MAX) : 60; // C4
	this.t = this.clampT(t !== undefined ? t : 0);
	this.radius = 4;
	this.draggable = true; // not draggable: ignores the mouse, but is drawn normally
}
SpiralPoint.prototype = Object.create(Point.prototype);
SpiralPoint.prototype.constructor = SpiralPoint;

SpiralPoint.prototype.hit = function(px, py, s)
{
	return this.draggable && Point.prototype.hit.call(this, px, py, s);
};

SpiralPoint.prototype.clampT = function(t)
{
	return clamp(t, T_MIN, T_MAX);
};

// moves the point to the spiral position of refPitch + t for a view of size s
SpiralPoint.prototype.place = function(s)
{
	var p = pitch2Spiral(this.refPitch + this.t);
	var q = spiral2Pixel(p[0], p[1]);
	this.x = q[0] / s[0];
	this.y = q[1] / s[1];
};

// x, y are normalized to the view size: the point goes to the nearest spiral point
// within refPitch + [T_MIN, T_MAX]
SpiralPoint.prototype.move = function(x, y)
{
	var s = size();
	var p = pixel2Spiral(x * s[0], y * s[1]);
	this.t = this.clampT(spiral2Pitch(p[0], p[1], this.refPitch + T_MIN, this.refPitch + T_MAX) - this.refPitch);
	this.place(s);
};

SpiralPoint.prototype.drawLines = function(s)
{
	var k, rad, q;
	var offset = pitch2Rad(this.refPitch + this.t) - pitch2Rad(0);
	var o = spiral2Pixel(0, 0);
	var c = this.color.slice();
	with (sketch) {
		gllinewidth(2);
		for (k = 0; k < RATIOS.length; k++) {
			// harmonicity from HARMONICITY_THRESHOLD..0 remapped to alpha 0..1
			c[3] = ALPHAS[k];
			glcolor(c);
			rad = offset + RADIANS[k];
			q = spiral2Pixel(RADIUS_MAX * Math.cos(rad), RADIUS_MAX * Math.sin(rad));
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

var COLORS = [OperatorColors.RED, OperatorColors.YELLOW, OperatorColors.GREEN, OperatorColors.CYAN, OperatorColors.BLUE, OperatorColors.MAGENTA];
var sliders = [];

(function() {
	var i, p;
	for (i = 0; i < COLORS.length; i++) {
		p = new SpiralPoint(36 + 7 * i - 60);
		p.setColor(COLORS[i]);
		p.draggable = false;
		sliders.push(p);
	}

	// point 6: white, not draggable, only moved by messages, hidden by default
	p = new SpiralPoint(0);
	p.setColor(OperatorColors.WHITE);
	p.draggable = false;
	p.visible = false;
	sliders.push(p);

	// the widget draws the items in the order added: point 6 first (bottom), point 0 last (top)
	for (i = sliders.length - 1; i >= 0; i--)
		widget.add(sliders[i]);
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
	sliders[i].t = t; // not clamped: [T_MIN, T_MAX] only limits dragging and the displayed range
	sliders[i].place(size());
	widget.changed();
	return true;
}

// sets the reference pitch of point i (0-127); t is kept, so the point moves on the spiral and
// the output does not change
function RefPitch(i, pitch)
{
	if (i < 0 || i >= sliders.length)
		return;
	sliders[i].refPitch = clamp(pitch, REF_MIN, REF_MAX);
	sliders[i].place(size());
	widget.changed();
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
		t = sliders[i].clampT(arguments[i]);
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
