// Color palette as [r, g, b, a] arrays, 0-1. Copy with .slice() before modifying.

function hex2rgb(hex)
{
	return Object.freeze([
		parseInt(hex.substr(0, 2), 16) / 255.,
		parseInt(hex.substr(2, 2), 16) / 255.,
		parseInt(hex.substr(4, 2), 16) / 255.,
		1.
	]);
}

function rgb2hex(r, g, b)
{
	return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

var OperatorColors = (function() {

	// https://coolors.co/ff544b-e8cf2a-66cf5b-2ae2df-008de2-ff8bc6
    var palette = ["ff544b","e8cf2a","66cf5b","2ae2df","008de2","ff8bc6"]
	return Object.freeze({
		RED: hex2rgb(palette[0]),
		YELLOW: hex2rgb(palette[1]),
		GREEN: hex2rgb(palette[2]),
		CYAN: hex2rgb(palette[3]),
		BLUE: hex2rgb(palette[4]),
		MAGENTA: hex2rgb(palette[5]),
		WHITE: hex2rgb("ffffff"),
		LIGHT_GRAY: hex2rgb("d3d3d3"),
		DARK_GRAY: hex2rgb("a9a9a9"),
		BLACK: hex2rgb("000000")
	});
})();

var AmpEnvelopeColors = (function() {

	// Example palette for amplitude envelopes
	// https://coolors.co/00ce7d-59a1be-b1ceff-d8cebe-ffce7d-ffcee8
    var palette = ["00ce7d","59a1be","b1ceff","d8cebe","ffce7d","ffcee8"]
	return Object.freeze({
		C0: hex2rgb(palette[0]),
		C1: hex2rgb(palette[1]),
		C2: hex2rgb(palette[2]),
		C3: hex2rgb(palette[3]),
		C4: hex2rgb(palette[4]),
		C5: hex2rgb(palette[5])
	});
})();

var PitchEnvelopeColors = (function() {

	// Example palette for envelopes
	// https://coolors.co/abda00-ffdb00-ffa400-ff6e03-ff376e-ff00dc
	var palette = ["abda00","ffdb00","ffa400","ff6e03","ff376e","ff00dc"];
	return Object.freeze({
		C0: hex2rgb(palette[0]),
		C1: hex2rgb(palette[1]),
		C2: hex2rgb(palette[2]),
		C3: hex2rgb(palette[3]),
		C4: hex2rgb(palette[4]),
		C5: hex2rgb(palette[5])
	});
})();



