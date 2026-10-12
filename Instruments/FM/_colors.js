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

	// https://coolors.co/ff544b-66cf5b-008de2-2ae2df-ff8bc6-e8cf2a
    var palette = ["ff544b","66cf5b","008de2","2ae2df","ff8bc6","e8cf2a"]
	return Object.freeze({
		RED: rgb(palette[0]),
		GREEN: rgb(palette[1]),
		BLUE: rgb(palette[2]),
		CYAN: rgb(palette[3]),
		MAGENTA: rgb(palette[4]),
		YELLOW: rgb(palette[5])
	});
})();

