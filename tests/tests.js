module("Basic Tests");

test("highlight", function() {
    var html = "<body><p>foo 1,200 mile trip</p></body>";
    var result = highlight(html, null);
    equal(result, "<body><p>foo <span style='background-color: yellow;'>1,200 mile</span> trip</p></body>");
    html = "xyzzy goo";
    equal(highlight(html, null), html);
});

test("conversions", function() {
    equal(milesToKilometers(10), "16 kilometers");
    equal(convertImperialToSI("fahrenheit", "-40"), "-40 Celsius");
    equal(convertImperialToSI("fahrenheit", "33.8"), "1 Celsius");
});

test("singularization", function() {
    var str = "mile miles foot feet fahrenheit fahrenheits yard yards gallon gallons ounce ounces pound pounds";
    var exp = "mile mile foot foot fahrenheit fahrenheit yard yard gallon gallon ounce ounce pound pound";
    equal(singularizeUnits(str), exp);
});

module("Search with regexps");

test("simple search", function() {
    var cases = [
        {
            text: "foo mile baz",
            expected: 4
        },
        {
            text: "foo miles baz",
            expected: 4
        },
        {
            text: "foo 1 mile baz",
            expected: 4
        },
        {
            text: "foo 12 miles baz",
            expected: 4
        },
        {
            text: "foo 3,600 miles baz",
            expected: 4
        }
    ]
    cases.forEach(function(testCase) {
        equal(searchImperial(testCase.text), testCase.expected, testCase.text);
    });
});

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
        }
    ]
    cases.forEach(function(testCase) {
        results = multisearch(testCase.text)
        equal(results.length, testCase.expected.length, "results length must match");
        for (var i = 0; i < results.length; ++i) {
            deepEqual(results[i], testCase.expected[i], testCase.text + " " + i + "th search");
        }
    });
});
