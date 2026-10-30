// Ordered list of Points joined by line segments. Requires point.js and the global `sketch`.

include("_point.js");

function PolyLine(points)
{
	this.points = points || [];
	this.color = Point.DEFAULT_COLOR.slice(); // line color, [r, g, b, a], 0-1
	this._enabled = true;
	this._visible = true;
}

// setting enabled or visible also sets it on every contained point
Object.defineProperty(PolyLine.prototype, "enabled", {
	get: function() { return this._enabled; },
	set: function(v) {
		var j;
		this._enabled = v;
		for (j = 0; j < this.points.length; j++)
			this.points[j].enabled = v;
	}
});

Object.defineProperty(PolyLine.prototype, "visible", {
	get: function() { return this._visible; },
	set: function(v) {
		var j;
		this._visible = v;
		for (j = 0; j < this.points.length; j++)
			this.points[j].visible = v;
	}
});

// sets the line color and the color of every point
PolyLine.prototype.setColor = function(c)
{
	var j;
	this.color = c.slice();
	for (j = 0; j < this.points.length; j++)
		this.points[j].color = c.slice();
};

PolyLine.prototype.add = function(x, y)
{
	var p = new Point(x, y);
	p.enabled = this._enabled;
	p.visible = this._visible;
	this.points.push(p);
};

PolyLine.prototype.remove = function(j)
{
	if (j >= 0 && j < this.points.length)
		this.points.splice(j, 1);
};

// filled(j) is optional and returns true if point j should be drawn filled
PolyLine.prototype.draw = function(s, filled)
{
	var j, w;
	var c = this.color.slice();

	if (!this._visible)
		return;
	if (!this._enabled)
		c[3] *= 0.5;

	with (sketch) {
		glcolor(c);
		gllinewidth(2);
		for (j = 0; j < this.points.length; j++) {
			w = this.points[j].toWorld(s);
			if (j == 0)
				moveto(w[0], w[1]);
			else
				lineto(w[0], w[1]);
		}
	}
	for (j = 0; j < this.points.length; j++)
		this.points[j].draw(s, filled ? filled(j) : false);
};
