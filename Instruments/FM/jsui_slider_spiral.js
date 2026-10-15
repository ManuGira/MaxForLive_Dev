/*

1d slider moving along a spiral, centered in the view, on a black background.
Outputs the slider value normalized to 0-1 (0 = center of the spiral, 1 = outer end).
The point is always constrained on the spiral.

spiral: angle(t) = 2*pi*t/TURN, radius(t) = A*t (in pixels), counter-clockwise.
t goes from 0 to the value where the spiral reaches the edge of the view.

messages:
	float / int v      set value (0-1) and output
	set v              set value, no output
	bang               output value
	colour r g b       color (0-255)

*/

include("_widget.js");
include("_colors.js");

Point.DEFAULT_COLOR = Colors.RED;

var A = 10; // radius growth per unit of t, in pixels
var TURN = 12; // units of t for one full turn
var MARGIN = 3; // pixels kept free between the spiral end and the view edge
var STEPS = 400; // samples used to draw the spiral
var REFINE = TURN / 4; // search half-width around the analytic estimate, in t

// largest t whose spiral point stays inside the view
function tMax(s)
{
	return Math.max(0, (Math.min(s[0], s[1]) / 2 - Point.DEFAULT_RADIUS - MARGIN) / A);
}

// pixel position relative to the view center (x right, y down) of the spiral at t
function spiralPixel(t)
{
	var a = 2 * Math.PI * t / TURN;
	return [A * t * Math.cos(a), -A * t * Math.sin(a)];
}

// t in [0, tmax] of the spiral point nearest to the pixel (dx, dy), relative to the view center.
// The angle phi of the pixel gives the spiral points at that angle, one per turn; the turn
// index is found from the radius gap; the neighbouring turns are refined locally and the closest
// is kept.
function nearestT(dx, dy, tmax)
{
	var phi = Math.atan2(-dy, dx); // inverse of the spiral angle, in (-pi, pi]
	var r = Math.sqrt(dx * dx + dy * dy);
	var f, k, i, j, t, d, lo, hi, m1, m2;
	var best = 0;
	var bestd = r * r; // t = 0 is the spiral center
	var candidates = [tmax];

	function dist(t)
	{
		var p = spiralPixel(t);
		return (p[0] - dx) * (p[0] - dx) + (p[1] - dy) * (p[1] - dy);
	}

	if (phi < 0)
		phi += 2 * Math.PI;
	f = phi / (2 * Math.PI); // fraction of a turn
	// radius gap between two turns is A*TURN: the turn index is the gap to the radius at phi
	k = Math.round((r - A * TURN * f) / (A * TURN));
	k = clamp(k, 0, Math.max(0, Math.floor(tmax / TURN - f)));
	for (i = k - 1; i <= k + 1; i++)
		candidates.push(clamp((f + i) * TURN, 0, tmax));

	for (i = 0; i < candidates.length; i++) {
		// the nearest point is not exactly at the same angle since the turns are slanted:
		// refine around each candidate (ternary search)
		lo = Math.max(0, candidates[i] - REFINE);
		hi = Math.min(tmax, candidates[i] + REFINE);
		for (j = 0; j < 30; j++) {
			m1 = lo + (hi - lo) / 3;
			m2 = hi - (hi - lo) / 3;
			if (dist(m1) < dist(m2))
				hi = m2;
			else
				lo = m1;
		}
		t = (lo + hi) / 2;
		d = dist(t);
		if (d < bestd) {
			bestd = d;
			best = t;
		}
	}
	return best;
}

var spiral = {
	points: [], // not draggable
	color: Point.DEFAULT_COLOR.slice(),

	setColor: function(c)
	{
		this.color = c.slice();
	},

	draw: function(s)
	{
		var tmax = tMax(s);
		var i, p;
		var c = this.color.slice();
		with (sketch) {
			glcolor(c);
			gllinewidth(2);
			for (i = 0; i <= STEPS; i++) {
				p = spiralPixel(tmax * i / STEPS);
				// pixels from center to world coordinates (view height spans 2 units)
				if (i == 0)
					moveto(p[0] * 2 / s[1], -p[1] * 2 / s[1]);
				else
					lineto(p[0] * 2 / s[1], -p[1] * 2 / s[1]);
			}
		}
	}
};
widget.add(spiral);

var handle = new Point(0.5, 0.5);
handle.value = 0; // 0-1 along the spiral

// moves the point to the spiral position of the current value for a view of size s
handle.place = function(s)
{
	var p = spiralPixel(this.value * tMax(s));
	this.x = (s[0] / 2 + p[0]) / s[0];
	this.y = (s[1] / 2 + p[1]) / s[1];
};

// x, y are normalized to the view size: the point goes to the nearest spiral point
handle.move = function(x, y)
{
	var s = size();
	var tmax = tMax(s);
	this.value = tmax > 0 ? nearestT(x * s[0] - s[0] / 2, y * s[1] - s[1] / 2, tmax) / tmax : 0;
	this.place(s);
};

// the spiral depends on the view size: keep the point on it after a resize
handle.draw = function(s, filled)
{
	this.place(s);
	Point.prototype.draw.call(this, s, filled);
};

widget.add(handle);

widget.output = function() {
	outlet(0, handle.value);
};

function set(v)
{
	handle.value = clamp(v, 0, 1);
	handle.place(size());
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
	return handle.value;
}
