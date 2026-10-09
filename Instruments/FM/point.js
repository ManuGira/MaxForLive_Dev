// Draggable point with x, y normalized to 0-1, (0,0) = top left. Drawn on the global `sketch`.

function clamp01(v)
{
	return Math.min(Math.max(0, v), 1);
}

function Point(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
	this.radius = Point.DEFAULT_RADIUS; // world units (view height spans 2)
	this.color = Point.DEFAULT_COLOR.slice(); // [r, g, b, a], 0-1
	this.enabled = true; // disabled: not draggable, never filled, drawn at half alpha
	this.visible = true; // invisible: not drawn and not draggable
}

Point.DEFAULT_RADIUS = 0.06;
Point.DEFAULT_COLOR = [1., 1., 1., 1.];

Point.prototype.move = function(x, y)
{
	this.x = clamp01(x);
	this.y = clamp01(y);
};

// px, py in pixels; s is [width, height] in pixels
Point.prototype.hit = function(px, py, s)
{
	var dx, dy, r;
	if (!this.visible || !this.enabled)
		return false;
	dx = px - this.x * s[0];
	dy = py - this.y * s[1];
	r = this.radius * s[1] / 2;
	return dx * dx + dy * dy <= r * r;
};

Point.prototype.toWorld = function(aspect)
{
	return [(this.x * 2 - 1) * aspect, 1 - this.y * 2];
};

Point.prototype.draw = function(aspect, filled)
{
	var w, c;
	if (!this.visible)
		return;
	w = this.toWorld(aspect);
	c = this.color.slice();
	if (!this.enabled)
		c[3] *= 0.5;
	with (sketch) {
		glcolor(c);
		gllinewidth(1);
		moveto(w[0], w[1]);
		if (filled && this.enabled){
			circle(this.radius);
            framecircle(this.radius);
        } else {
            framecircle(this.radius);
        }
	}
};
