/*

6 draggable pitch (AD) envelopes sharing the same area, one color each. Each envelope is a PolyLine of 3 points:
p0 initial pitch, fixed at x=0, y is free (y=0.5 means A=0, top is +1, bottom is -1),
p1 end of decay, x is free, y is fixed at 0.5 (A=0),
p2 (hidden, fixed at the right edge, y=0.5) extends the line to the end.
Outputs "i A D": pitch amount A in [-1, 1] and decay time D, both scaled by adScale.

messages:
	set i A D          set envelope i (0-5), no output
	list i A D         set envelope i and output
	visible i v        show (1) or hide (0) envelope i
	bang               output every envelope
	update             redraw; send it from a metro to throttle redraws
	colour r g b       color for all envelopes (0-255)

*/
include("_widget.js");

var COLORS = [PitchEnvelopeColors.C0, PitchEnvelopeColors.C1, PitchEnvelopeColors.C2, PitchEnvelopeColors.C3, PitchEnvelopeColors.C4, PitchEnvelopeColors.C5];
var envelopes = [];

// Output scale: A from [-1, 1] and D from [0, 1] (D in milliseconds)
var adScale = [24.0, 1000.0];

function scaleADOutput(a, d)
{
	return [a * adScale[0], d * adScale[1]];
}

function scaleADInput(a, d)
{
	return [a / adScale[0], d / adScale[1]];
}

// A in [-1, 1] <-> y of p0 in [1, 0]
function setEnvelope(env, a, d)
{
	var p = env.points;
	p[0].setValue(0, 0.5 - clamp(a, -1, 1) / 2);
	p[1].setValue(d, 0.5);
}

function makeEnvelope(color)
{
	var p = [new Point(0, 0.5), new Point(0.5, 0.5), new Point(1, 0.5)];
	var env = new PolyLine(p);
	p[0].setLimits(0, 0, 0, 1);
	p[1].setLimits(0, 0.5, 1, 0.5);
	p[2].setLimits(1, 0.5, 1, 0.5);
	env.setColor(color);
	setEnvelope(env, 0.5, 0.3);
	p[2].visible = false;
	return env;
}

(function() {
	var i, env;
	for (i = 0; i < COLORS.length; i++) {
		env = makeEnvelope(COLORS[i]);
		envelopes.push(env);
	}
	for (i = envelopes.length-1; i >= 0; i--)
		widget.add(envelopes[i]);
})();

function output(i)
{
	var p = envelopes[i].points;
	var a01 = 1 - 2 * p[0].y;
	var d01 = p[1].valueX();
	var v = scaleADOutput(a01, d01);
	outlet(0, i, v[0], v[1]);
}

widget.output = function(p) {
	var i;
	if (!p) {
		for (i = 0; i < envelopes.length; i++)
			output(i);
		return;
	}
	for (i = 0; i < envelopes.length; i++) {
		if (envelopes[i].points.indexOf(p) >= 0) {
			output(i);
			return;
		}
	}
};

function visible(i, v)
{
	if (i < 0 || i >= envelopes.length)
		return;
	envelopes[i].visible = v != 0;
	envelopes[i].points[2].visible = false; // setting visible propagates to all points
}

function set(i, a, d)
{
	var v;
	if (i < 0 || i >= envelopes.length)
		return;
	v = scaleADInput(a, d);
	setEnvelope(envelopes[i], v[0], v[1]);
}

function list(i, a, d)
{
	set(i, a, d);
	if (i >= 0 && i < envelopes.length)
		output(i);
}

// called by a metro (e.g. every 200 ms) to throttle redraws
function update()
{
	redraw();
}
