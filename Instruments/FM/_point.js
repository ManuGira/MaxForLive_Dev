// Draggable point with x, y normalized to 0-1, (0,0) = top left. Drawn on the global `sketch`.

function clamp(v, lo, hi)
{
	return Math.min(Math.max(lo, v), hi);
}

function Point(x, y)
{
	this.minx = 0; // x and y are always kept within [minx, maxx] and [miny, maxy]
	this.miny = 0;
	this.maxx = 1;
	this.maxy = 1;
	this.move(x, y);
	this.radius = Point.DEFAULT_RADIUS; // pixels
	this.color = Point.DEFAULT_COLOR.slice(); // [r, g, b, a], 0-1
	this.enabled = true; // disabled: not draggable, never filled, drawn at half alpha
	this.visible = true; // invisible: not drawn and not draggable
}

Point.DEFAULT_RADIUS = 7; // pixels
Point.DEFAULT_COLOR = [1., 1., 1., 1.];

Point.prototype.move = function(x, y)
{
	this.x = clamp(x, this.minx, this.maxx);
	this.y = clamp(y, this.miny, this.maxy);
};

Point.prototype.setLimits = function(minx, miny, maxx, maxy)
{
	this.minx = minx;
	this.miny = miny;
	this.maxx = maxx;
	this.maxy = maxy;
	this.move(this.x, this.y);
};

// position as 0-1 fractions of the [min, max] limits (0 when the range is empty)
Point.prototype.valueX = function()
{
	return this.maxx > this.minx ? (this.x - this.minx) / (this.maxx - this.minx) : 0;
};

Point.prototype.valueY = function()
{
	return this.maxy > this.miny ? (this.y - this.miny) / (this.maxy - this.miny) : 0;
};

Point.prototype.setValue = function(fx, fy)
{
	this.move(this.minx + clamp(fx, 0, 1) * (this.maxx - this.minx),
		this.miny + clamp(fy, 0, 1) * (this.maxy - this.miny));
};

Point.prototype.setColor = function(c)
{
	this.color = c.slice();
};

// px, py in pixels; s is [width, height] in pixels
Point.prototype.hit = function(px, py, s)
{
	var dx, dy, r;
	if (!this.visible || !this.enabled)
		return false;
	dx = px - this.x * s[0];
	dy = py - this.y * s[1];
	r = this.radius;
	return dx * dx + dy * dy <= r * r;
};

// s is [width, height] in pixels; returns world coordinates
Point.prototype.toWorld = function(s)
{
	return [(this.x * 2 - 1) * s[0] / s[1], 1 - this.y * 2];
};

Point.prototype.draw = function(s, filled)
{
	var w, c, r;
	if (!this.visible)
		return;
	w = this.toWorld(s);
	r = this.radius * 2 / s[1]; // view height spans 2 world units
	c = this.color.slice();
	if (!this.enabled)
		c[3] *= 0.5;
	with (sketch) {
		glcolor(c);
		gllinewidth(2);
		moveto(w[0], w[1]);
		if (filled && this.enabled) {
			circle(r);
			framecircle(r);
		} else {
			framecircle(r);
		}
	}
};
