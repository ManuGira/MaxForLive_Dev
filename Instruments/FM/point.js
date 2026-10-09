// Draggable point with x, y normalized to 0-1, (0,0) = top left. Drawn on the global `sketch`.

function clamp01(v)
{
	return Math.min(Math.max(0, v), 1);
}

function Point(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
}

Point.RADIUS = 0.1; // world units (view height spans 2)

Point.prototype.move = function(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
};

// px, py in pixels; s is [width, height] in pixels
Point.prototype.hit = function(px, py, s)
{
	var dx = px - this.x * s[0];
	var dy = py - this.y * s[1];
	var r = Point.RADIUS * s[1] / 2;
	return dx * dx + dy * dy <= r * r;
};

Point.prototype.toWorld = function(aspect)
{
	return [(this.x * 2 - 1) * aspect, 1 - this.y * 2];
};

Point.prototype.draw = function(aspect, filled)
{
	var w = this.toWorld(aspect);
	with (sketch) {
		moveto(w[0], w[1]);
		if (filled)
			circle(Point.RADIUS);
		else
			framecircle(Point.RADIUS);
	}
};
