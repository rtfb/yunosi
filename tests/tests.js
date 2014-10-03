module("Basic Tests");

test("conversions", function() {
    equal(convertImperialToSI("fahrenheit", "-40"), "-40 Celsius");
    equal(convertImperialToSI("fahrenheit", "33.8"), "1 Celsius");

    equal(convertImperialToSI("mile", "10"), "16 kilometers");
    equal(convertImperialToSI("foot", "10"), "3 meters");
    equal(convertImperialToSI("yard", "10"), "9 meters");
    equal(convertImperialToSI("gallon", "10"), "37.9 liters");
    equal(convertImperialToSI("ounce", "10"), "283 grams");
    equal(convertImperialToSI("oz", "10"), "283 grams");
    equal(convertImperialToSI("pound", "10"), "4.54 kilograms");
    equal(convertImperialToSI("inch", "10"), "25.4 centimeters");
    equal(convertImperialToSI("in", "10"), "25.4 centimeters");

    equal(convertImperialToSI("disexisting-unit", "10"), "10 disexisting-unit");
});

test("singularization", function() {
    var str = "mile miles foot feet fahrenheit fahrenheits yard yards "
        + "gallon gallons ounce ounces pound pounds inch inches";
    var exp = "mile mile foot foot fahrenheit fahrenheit yard yard "
        + "gallon gallon ounce ounce pound pound inch inch";
    equal(singularizeUnits(str), exp);
});

module("Rounding Tests");

test("basic rounding heuristics", function() {
    deepEqual(roundDecimal("056000000000001", 2), {decimal: "06", carry: 0});
    deepEqual(roundDecimal("056000000000001", 3), {decimal: "056", carry: 0});
    deepEqual(roundDecimal("056000000000001", 5), {decimal: "056", carry: 0});
    deepEqual(roundDecimal("056009000000001", 5), {decimal: "05601", carry: 0});
    deepEqual(roundDecimal("056003000000001", 5), {decimal: "056", carry: 0});
    deepEqual(roundDecimal("956", 1), {decimal: "", carry: 1});
    deepEqual(roundDecimal("1", 3), {decimal: "1", carry: 0});
    deepEqual(roundDecimal("100", 3), {decimal: "1", carry: 0});

    equal(roundForReadability(0.5), 0.5);
    equal(roundForReadability(0.55), 0.55);
    equal(roundForReadability(0.555), 0.56);
    equal(roundForReadability(0.553), 0.55);
    equal(roundForReadability(0.999), 1);
    equal(roundForReadability(5), 5);
    equal(roundForReadability(5.056000000000001), 5.06);
    equal(roundForReadability(7.996), 8);
    equal(roundForReadability(9.996), 10);
    equal(roundForReadability(10.056000000000001), 10.1);
    equal(roundForReadability(25.056000000000001), 25.1);
    equal(roundForReadability(25.956), 26);
    equal(roundForReadability(125.956), 126);
    equal(roundForReadability(125.1), 125);
});

module("Search with regexps");

test("multiple occurrence search", function() {
    var cases = [
        {
            text: "foo 1 mile 2 miles 3 miles baz",
            expected: [
                {
                    index: 4,
                    match: "1 mile",
                    numeral: 1,
                    units: "mile"
                },
                {
                    index: 11,
                    match: "2 miles",
                    numeral: 2,
                    units: "mile"
                },
                {
                    index: 19,
                    match: "3 miles",
                    numeral: 3,
                    units: "mile"
                }
            ]
        },
        {
            text: "fly 3,600 miles and walk 3 miles",
            expected: [
                {
                    index: 4,
                    match: "3,600 miles",
                    numeral: 3600,
                    units: "mile"
                },
                {
                    index: 25,
                    match: "3 miles",
                    numeral: 3,
                    units: "mile"
                }
            ]
        },
        {
            text: "fly 100 yards and walk 1000 feet 40 Fahrenheit",
            expected: [
                {
                    index: 4,
                    match: "100 yards",
                    numeral: 100,
                    units: "yard"
                },
                {
                    index: 23,
                    match: "1000 feet",
                    numeral: 1000,
                    units: "foot"
                },
                {
                    index: 33,
                    match: "40 Fahrenheit",
                    numeral: 40,
                    units: "fahrenheit"
                }
            ]
        },
        {
            text: "foo bar baz",
            expected: []
        },
        {
            text: "60-inch telescope, 12 inches, 1 inch",
            expected: [
                {
                    index: 0,
                    match: "60-inch",
                    numeral: 60,
                    units: "inch"
                },
                {
                    index: 19,
                    match: "12 inches",
                    numeral: 12,
                    units: "inch"
                },
                {
                    index: 30,
                    match: "1 inch",
                    numeral: 1,
                    units: "inch"
                }
            ]
        },
        {
            text: "The 1.35 mile self-guided nature trail",
            expected: [
                {
                    index: 4,
                    match: "1.35 mile",
                    numeral: 1.35,
                    units: "mile"
                }
            ]
        },
        {
            text: "The Black Bear Trail is 0.6 miles long",
            expected: [
                {
                    index: 24,
                    match: "0.6 miles",
                    numeral: 0.6,
                    units: "mile"
                }
            ]
        },
        {
            // A bug used to match this, treating "." as a malformed number and
            // "In" as inches. Adding this negative test here to guard against
            // regressions.
            text: "follow. Instead",
            expected: []
        }
    ]
    cases.forEach(function(testCase) {
        results = multisearch(testCase.text)
        equal(results.length, testCase.expected.length,
            "results length must match for test '" + testCase.text + "'");
        for (var i = 0; i < results.length; ++i) {
            deepEqual(results[i], testCase.expected[i],
                testCase.text + ". " + i + "th search");
        }
    });
});
