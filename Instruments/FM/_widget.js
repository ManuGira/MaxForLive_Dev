/*

Generic jsui widget on a black background: draws Points and PolyLines, handles hover,
dragging, redraw and the colour/fsaa messages. Include it from a jsui script:

	var handle = new Point(0.5, 0.5);
	widget.add(handle);
	widget.output = function(p) { outlet(0, handle.valueX()); };

widget.add(item)    add a Point or PolyLine and redraw, so configure the item first. Items are
                    drawn in the order added (the last is on top).
                    The points of a PolyLine are draggable too; disabled or invisible ones are not.
widget.output(p)    set by the script: called with the dragged Point while dragging, and
                    with no argument on bang
widget.changed()    call after changing points from a message: notifies pattr and redraws

The script must not declare functions named size, draw, redraw, bang, colour, fsaa,
onidle, onidleout, onclick, ondrag or onresize: they are defined here.

*/

inlets = 1;
outlets = 1;

include("_point.js");
include("_poly_line.js");
include("_colors.js");

sketch.default2d();
sketch.fsaa = 1;

var widget = {
	items: [],
	output: null,
	hovered: null, // Point under the mouse
	dragged: null, // Point being dragged
	grab_dx: 0, // pixel offset between mouse and point center at click
	grab_dy: 0,

	add: function(item)
	{
		this.items.push(item);
		draw();
		return item;
	},

	changed: function()
	{
		notifyclients();
		redraw();
	},

	isActive: function(p)
	{
		return p === this.hovered || p === this.dragged;
	},

	// topmost point under the pixel position, or null
	hitTest: function(x, y)
	{
		var s = size();
		var i, j, item;
		for (i = this.items.length - 1; i >= 0; i--) {
			item = this.items[i];
			if (item.points) {
				for (j = item.points.length - 1; j >= 0; j--)
					if (item.points[j].hit(x, y, s))
						return item.points[j];
			} else if (item.hit(x, y, s)) {
				return item;
			}
		}
		return null;
	}
};

function size()
{
	return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function draw()
{
	var s = size();
	var i, item;

	with (sketch) {
		shapeslice(180, 1);
		glclearcolor(0, 0, 0, 1);
		glclear();
	}
	for (i = 0; i < widget.items.length; i++) {
		item = widget.items[i];
		if (item.points)
			item.draw(s, function(j) { return widget.isActive(item.points[j]); });
		else
			item.draw(s, widget.isActive(item));
	}
}

function redraw()
{
	draw();
	refresh();
}

function bang()
{
	redraw();
	if (widget.output)
		widget.output();
}

function colour(r, g, b)
{
	var c = [r / 255., g / 255., b / 255., 1.];
	var i;
	Point.DEFAULT_COLOR = c;
	for (i = 0; i < widget.items.length; i++)
		widget.items[i].setColor(c);
	redraw();
}

function fsaa(v)
{
	sketch.fsaa = v;
	redraw();
}

// mouse events: x, y are in pixels, (0,0) top left
function onidle(x, y)
{
	var p = widget.hitTest(x, y);
	if (p !== widget.hovered) {
		widget.hovered = p;
		redraw();
	}
}
onidle.local = 1;

function onidleout()
{
	if (widget.hovered) {
		widget.hovered = null;
		redraw();
	}
}
onidleout.local = 1;

function onclick(x, y)
{
	var s = size();
	widget.dragged = widget.hitTest(x, y);
	if (widget.dragged) {
		widget.grab_dx = widget.dragged.x * s[0] - x;
		widget.grab_dy = widget.dragged.y * s[1] - y;
		redraw();
	}
}
onclick.local = 1;

function ondrag(x, y, but)
{
	var s = size();
	if (!but) {
		widget.dragged = null;
		widget.hovered = widget.hitTest(x, y);
		redraw();
		return;
	}
	if (!widget.dragged)
		return;
	widget.dragged.move((x + widget.grab_dx) / s[0], (y + widget.grab_dy) / s[1]);
	widget.changed();
	if (widget.output)
		widget.output(widget.dragged);
}
ondrag.local = 1;

function onresize(w, h)
{
	redraw();
}
onresize.local = 1;
