/*

6 draggable ADSR envelopes sharing the same area, one color each. Each envelope is a PolyLine of 5 points:
p0 (hidden, fixed at the bottom left), p1 attack peak, p2 end of decay / sustain level,
p3 (hidden, end of sustain, follows p2), p4 end of release.
Outputs "i a d s r", all 0-1: attack time, decay time, sustain level, release time.

messages:
	set i a d s r      set envelope i (0-5), no output
	list i a d s r     set envelope i and output
	visible i v        show (1) or hide (0) envelope i
	bang               output every envelope
	colour r g b       color for all envelopes (0-255)

*/
include("_widget.js");

var COLORS = [AmpEnvelopeColors.C0, AmpEnvelopeColors.C1, AmpEnvelopeColors.C2, AmpEnvelopeColors.C3, AmpEnvelopeColors.C4, AmpEnvelopeColors.C5];
var SEGMENT = 0.33; // max x travel of p1, p2 and p4
var SUSTAIN_END = 0.66; // x of p3 and min x of p4
var envelopes = [];

// Convert ADSR values from [0-1] to millisecond for attack, decay, and release; sustain remains 0-1
var adsrScale = [1000.0, 1000.0, 1.0, 1000.0];

function scaleADSROutput(a, d, s, r)
{
	return [a * adsrScale[0], d * adsrScale[1], s * adsrScale[2], r * adsrScale[3]];
}

function scaleADSRInput(a, d, s, r)
{
	return [a / adsrScale[0], d / adsrScale[1], s / adsrScale[2], r / adsrScale[3]];
}

// keeps the points of env consistent after point j moved
function constrain(env, j)
{
	var p = env.points;
	var fx;
	if (j == 1) {
		fx = p[2].valueX();
		p[2].setLimits(p[1].x, 0, p[1].x + SEGMENT, 1);
		p[2].setValue(fx, p[2].valueY());
	}
	if (j == 1 || j == 2)
		p[3].setLimits(SUSTAIN_END, p[2].y, SUSTAIN_END, p[2].y);
}

function setEnvelope(env, a, d, s, r)
{
	var p = env.points;
	p[1].setValue(a, 0);
	constrain(env, 1);
	p[2].setValue(d, 1 - s);
	constrain(env, 2);
	p[4].setValue(r, 0);
}

function makeEnvelope(color)
{
	var p = [new Point(0, 1), new Point(0, 0), new Point(0, 0), new Point(SUSTAIN_END, 0), new Point(1, 1)];
	var env = new PolyLine(p);
	p[0].setLimits(0, 1, 0, 1);
	p[1].setLimits(0, 0, SEGMENT, 0);
	p[4].setLimits(SUSTAIN_END, 1, 1, 1);
	env.setColor(color);
	setEnvelope(env, 0.3, 0.5, 0.6, 0.5);
	p[0].visible = false;
	p[3].visible = false;
	return env;
}

(function() {
	var i, env;
	for (i = 0; i < COLORS.length; i++) {
		env = makeEnvelope(COLORS[i]);
		envelopes.push(env);
		widget.add(env);
	}
})();

function output(i)
{
	var p = envelopes[i].points;
	var a01 = p[1].valueX();
	var d01 = p[2].valueX();
	var s01 = 1 - p[2].valueY();
	var r01 = p[4].valueX();
	[a, d, s, r] = scaleADSROutput(a01, d01, s01, r01);
	outlet(0, i, a, d, s, r);
}

widget.output = function(p) {
	var i, j;
	if (!p) {
		for (i = 0; i < envelopes.length; i++)
			output(i);
		return;
	}
	for (i = 0; i < envelopes.length; i++) {
		j = envelopes[i].points.indexOf(p);
		if (j >= 0) {
			constrain(envelopes[i], j);
			widget.changed(); // constrain may have moved other points after the drag's redraw
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
	envelopes[i].points[0].visible = false; // setting visible propagates to all points
	envelopes[i].points[3].visible = false;
	widget.changed();
}

function set(i, a, d, s, r)
{
	[a, d, s, r] = scaleADSRInput(a, d, s, r);
	if (i < 0 || i >= envelopes.length)
		return;
	setEnvelope(envelopes[i], a, d, s, r);
	widget.changed();
}

function list(i, a, d, s, r)
{
	set(i, a, d, s, r);
	if (i >= 0 && i < envelopes.length)
		output(i);
}

// pattr state: a0 d0 s0 r0 a1 d1 s1 r1 ...
function setvalueof()
{
	var i;
	for (i = 0; i < envelopes.length && 4 * i + 3 < arguments.length; i++)
		setEnvelope(envelopes[i], arguments[4 * i], arguments[4 * i + 1], arguments[4 * i + 2], arguments[4 * i + 3]);
	widget.changed();
	widget.output();
}

function getvalueof()
{
	var v = [];
	var i, p;
	for (i = 0; i < envelopes.length; i++) {
		p = envelopes[i].points;
		v.push(p[1].valueX(), p[2].valueX(), 1 - p[2].valueY(), p[4].valueX());
	}
	return v;
}
