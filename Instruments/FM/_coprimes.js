// Returns all [i, j] pairs for i and j in [min, max] (inclusive), as an array of 2-element arrays.
function allPairs(min, max)
{
	min = (min === undefined) ? 1 : min;
	max = (max === undefined) ? 20 : max;
	var pairs = [];
	for (var i = min; i <= max; i++) {
		for (var j = min; j <= max; j++) {
			pairs.push([i, j]);
		}
	}
	return pairs;
}

function gcd(a, b)
{
	while (b !== 0) {
		var t = a % b;
		a = b;
		b = t;
	}
	return a;
}

// Keeps only the pairs [i, j] whose gcd is 1.
function filterCoprimes(pairs)
{
	return pairs.filter(function (p) {
		return gcd(p[0], p[1]) === 1;
	});
}

function harmonicity(a, b)
{
    return -Math.log(a * b)/Math.log(2);
}

function generate_simple_ratios(lowest_harmonicity)
{
    // assert harmonicity is defined and negative
    if (lowest_harmonicity === undefined || lowest_harmonicity >= 0) {
        throw new Error("lowest_harmonicity must be defined and negative");
    }

    var N = Math.ceil(Math.pow(2, -lowest_harmonicity/2));

    var pairs = allPairs(1, N);

    // Coprime pairs: Keeps only the pairs [i, j] whose gcd is 1
    pairs = filterCoprimes(pairs);

    // Octave pairs: Keeps only the pairs [i, j] whose ratio is less than or equal to 2 (within one octave)
    pairs = pairs.filter(function (p) {
        var ratio = p[0] / p[1];
        return 1 <= ratio && ratio < 2;
    });


    // prepend the pair with its harmonicity value
    pairs = pairs.map(function (p) {
        return [harmonicity(p[0], p[1])].concat(p);
    });

    // sort the pairs by their harmonicity value (descending)
    pairs.sort(function (a, b) {
        return b[0] - a[0];
    });

    // log the pair with lowest harmonicity value
    if (pairs.length > 0) {
        // post("Lowest harmonicity pair: " + pairs[pairs.length - 1] + "\n");
    }

    // keep only the pairs with harmonicity value greater than lowest_harmonicity
    pairs = pairs.filter(function (p) {
        return p[0] > lowest_harmonicity;
    });

    // log all tuples for debugging
    for (var i = 0; i < pairs.length; i++) {
        var tuple = pairs[i];
        // post(tuple + "\n");
    }

    return pairs;
}

