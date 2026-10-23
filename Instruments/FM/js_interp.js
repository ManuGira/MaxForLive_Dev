// mg.interp.js
// Piecewise-linear interpolation.
//  - list "x0 y0 x1 y1 ..." : defines the datapoints (sorted by x automatically)
//  - the same list can be given as object arguments: [js js_interp.js 1 0 2 1]
//  - float / int x          : outputs the interpolated y
//    Outside the x range, the y of the nearest end point is output (clamped).

inlets = 1;
outlets = 1;

var points = []; // [{x, y}, ...] sorted by x

// initial datapoints from the object arguments: [js js_interp.js 1 0 2 1]
// jsarguments[0] is the script name, so the values start at index 1
if (jsarguments.length > 1) {
	setPoints(jsarguments.slice(1));
}

function list() {
	setPoints(arrayfromargs(arguments));
}

function setPoints(args) {
	var pts = [];
	for (var i = 0; i + 1 < args.length; i += 2) {
		var x = Number(args[i]);
		var y = Number(args[i + 1]);
		if (isNaN(x) || isNaN(y)) {
			error("mg.interp: non-numeric value in list\n");
			return;
		}
		pts.push({ x: x, y: y });
	}
	if (args.length % 2 != 0) {
		post("mg.interp: odd number of values, last one ignored\n");
	}
	pts.sort(function (a, b) { return a.x - b.x; });
	points = pts;
}

function msg_float(x) {
	if (points.length == 0) {
		return;
	}
	outlet(0, interpolate(x));
}

function msg_int(x) {
	msg_float(x);
}

function interpolate(x) {
	var n = points.length;
	if (x <= points[0].x) {
		return points[0].y;
	}
	if (x >= points[n - 1].x) {
		return points[n - 1].y;
	}
	// binary search for the segment [lo, lo+1] containing x
	var lo = 0;
	var hi = n - 1;
	while (hi - lo > 1) {
		var mid = (lo + hi) >> 1;
		if (points[mid].x <= x) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	var p0 = points[lo];
	var p1 = points[hi];
	if (p1.x == p0.x) {
		return p1.y;
	}
	return p0.y + (p1.y - p0.y) * (x - p0.x) / (p1.x - p0.x);
}
