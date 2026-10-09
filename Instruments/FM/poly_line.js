// Ordered list of Points joined by line segments. Requires point.js and the global `sketch`.

function PolyLine(points)
{
	this.points = points || [];
}

PolyLine.prototype.add = function(x, y)
{
	this.points.push(new Point(x, y));
};

PolyLine.prototype.remove = function(j)
{
	if (j >= 0 && j < this.points.length)
		this.points.splice(j, 1);
};

// filled(j) is optional and returns true if point j should be drawn filled
PolyLine.prototype.draw = function(aspect, filled)
{
	var j, w;

	with (sketch) {
		for (j = 0; j < this.points.length; j++) {
			w = this.points[j].toWorld(aspect);
			if (j == 0)
				moveto(w[0], w[1]);
			else
				lineto(w[0], w[1]);
		}
	}
	for (j = 0; j < this.points.length; j++)
		this.points[j].draw(aspect, filled ? filled(j) : false);
};
