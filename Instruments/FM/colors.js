// Color palette as [r, g, b, a] arrays, 0-1. Copy with .slice() before modifying.

var Colors = (function() {
	function rgb(hex)
	{
		return Object.freeze([
			parseInt(hex.substr(0, 2), 16) / 255.,
			parseInt(hex.substr(2, 2), 16) / 255.,
			parseInt(hex.substr(4, 2), 16) / 255.,
			1.
		]);
	}

    var palette = ["ff6b6b", "ffa048", "ffd93d", "4ded9f", "4deeea", "d980fa"]
	return Object.freeze({
		RED: rgb(palette[0]),
		GREEN: rgb(palette[1]),
		BLUE: rgb(palette[2]),
		CYAN: rgb(palette[3]),
		MAGENTA: rgb(palette[4]),
		YELLOW: rgb(palette[5])
	});
})();
