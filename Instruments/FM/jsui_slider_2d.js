/*

2d slider: one draggable point on a black background.
Outputs "x y" normalized to 0-1 over the travel range, (0,0) = top left, (1,1) = bottom right.

messages:
	list x y           set position (0-1) and output
	set x y            set position, no output
	bang               output position
	colour r g b       color (0-255)

*/
include("_widget.js");

Point.DEFAULT_COLOR = Colors.BLUE;

var handle = new Point(0.5, 0.5);
handle.setLimits(0.025, 0.025, 0.975, 0.975); // travel range, normalized to view size
widget.add(handle);

widget.output = function() {
	outlet(0, handle.valueX(), handle.valueY());
};

function set(x, y)
{
	handle.setValue(x, y);
	widget.changed();
}

function list(x, y)
{
	set(x, y);
	widget.output();
}

function setvalueof(x, y)
{
	list(x, y);
}

function getvalueof()
{
	return [handle.valueX(), handle.valueY()];
}
