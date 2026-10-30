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


function _getColor(paletteName, index)
{
	switch(paletteName) {
		case "OperatorColors":
			var palette = [OperatorColors.RED, OperatorColors.YELLOW, OperatorColors.GREEN, OperatorColors.CYAN, OperatorColors.BLUE, OperatorColors.MAGENTA];
			return palette[index % palette.length];
		case "AmpEnvelopeColors":
			var palette = [AmpEnvelopeColors.C0, AmpEnvelopeColors.C1, AmpEnvelopeColors.C2, AmpEnvelopeColors.C3, AmpEnvelopeColors.C4, AmpEnvelopeColors.C5];
			return palette[index % palette.length];
		case "PitchEnvelopeColors":
			var palette = [PitchEnvelopeColors.C0, PitchEnvelopeColors.C1, PitchEnvelopeColors.C2, PitchEnvelopeColors.C3, PitchEnvelopeColors.C4, PitchEnvelopeColors.C5];
			return palette[index % palette.length];
		default:
			post("Unknown paletteName: " + paletteName + "\n");
			return null;
	}
}

function getColor(paletteName, index)
{
	var color = _getColor(paletteName, index);
	outlet(0, color);
}

function blendColors(paletteName, weight1, weight2, weight3, weight4, weight5, weight6)
{
	// raises each color to the power 2 for blending in linear space
	var c1 = _getColor(paletteName, 0);
	var c2 = _getColor(paletteName, 1);
	var c3 = _getColor(paletteName, 2);
	var c4 = _getColor(paletteName, 3);
	var c5 = _getColor(paletteName, 4);
	var c6 = _getColor(paletteName, 5);
	c1 = c1.map(function(x) { return x * x; });
	c2 = c2.map(function(x) { return x * x; });
	c3 = c3.map(function(x) { return x * x; });
	c4 = c4.map(function(x) { return x * x; });
	c5 = c5.map(function(x) { return x * x; });
	c6 = c6.map(function(x) { return x * x; });

	var r2 = c1[0] * weight1 + c2[0] * weight2 + c3[0] * weight3 + c4[0] * weight4 + c5[0] * weight5 + c6[0] * weight6;
	var g2 = c1[1] * weight1 + c2[1] * weight2 + c3[1] * weight3 + c4[1] * weight4 + c5[1] * weight5 + c6[1] * weight6;
	var b2 = c1[2] * weight1 + c2[2] * weight2 + c3[2] * weight3 + c4[2] * weight4 + c5[2] * weight5 + c6[2] * weight6;

	// var norm_factor = Math.max(0.01, r2, g2, b2);
	var norm_factor = Math.max(0.01, weight1, weight2, weight3, weight4, weight5, weight6);

	var r = Math.max(0, Math.min(1, Math.sqrt(r2 / norm_factor)));
	var g = Math.max(0, Math.min(1, Math.sqrt(g2 / norm_factor)));
	var b = Math.max(0, Math.min(1, Math.sqrt(b2 / norm_factor)));

	outlet(0, [r, g, b]);
}