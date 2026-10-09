# _widget.js

Base for custom `jsui` widgets. It draws `Point`s and `PolyLine`s on a black background and handles hover, dragging, redraw, and the `bang`, `colour` and `fsaa` messages. A widget script only declares its items and what to output.

## Files

Keep these in the same folder as the `jsui` script and the device (Max resolves `include` from there):

| File | Content |
|---|---|
| `_widget.js` | the widget base, includes the three files below |
| `_point.js` | `Point` |
| `_poly_line.js` | `PolyLine` |
| `_colors.js` | `Colors` palette (`RED`, `GREEN`, `BLUE`, `CYAN`, `MAGENTA`, `YELLOW`) |

## Minimal widget

```js
include("_widget.js");

var handle = new Point(0.5, 0.5);
handle.setLimits(0.025, 0.5, 0.975, 0.5); // minx, miny, maxx, maxy
widget.add(handle);

widget.output = function(p) { outlet(0, handle.valueX()); };

function set(v)
{
	handle.setValue(v, 0);
	widget.changed();
}
```

## API

- `widget.add(item)`: add a `Point` or `PolyLine`. Configure the item before adding it, since this redraws. Items are drawn in the order added, the last on top. The points of a `PolyLine` are draggable too.
- `widget.output(p)`: assign it in your script. Called with the dragged `Point` while dragging, and with no argument on `bang`.
- `widget.changed()`: call it after changing points from your own messages. It notifies pattr and redraws.

## Point

Position `x`, `y` is normalized to 0-1, (0,0) = top left.

- Properties: `radius` (pixels), `color` (`[r, g, b, a]`, 0-1), `enabled`, `visible`. A disabled point is not draggable, is never filled and is drawn at half alpha. An invisible point is not drawn and not draggable.
- `setLimits(minx, miny, maxx, maxy)`: constrain movement. Default is 0, 0, 1, 1.
- `move(x, y)`: set the position, clamped to the limits.
- `valueX()`, `valueY()`: position as a 0-1 fraction of the limits.
- `setValue(fx, fy)`: set the position from 0-1 fractions of the limits.

## PolyLine

`new PolyLine([points])` joins its points with lines.

- `points`, `add(x, y)`, `remove(j)`
- `color`, `enabled`, `visible`: `enabled` and `visible` are propagated to the points. A disabled polyline draws its lines at half alpha.
- `setColor(c)`: sets the line and point colors.

## Rules

- Do not declare functions named `size`, `draw`, `redraw`, `bang`, `colour`, `fsaa`, `onidle`, `onidleout`, `onclick`, `ondrag` or `onresize` in the script. They are defined by `_widget.js`.
- Set `Point.DEFAULT_COLOR` (for example `Colors.BLUE`) before creating items to change their default color.
- Implement `getvalueof` and `setvalueof` in your script to save state with pattr.

## Examples

`jsui_slider.js` (1D slider with a track) and `jsui_slider_2d.js` (2D slider).
