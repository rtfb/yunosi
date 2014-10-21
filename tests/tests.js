module("Basic Tests");

test("conversions", function() {
    equal(nlp.convertImperialToSI("fahrenheit", "-40"), "-40 Celsius");
    equal(nlp.convertImperialToSI("fahrenheit", "33.8"), "1 Celsius");

    equal(nlp.convertImperialToSI("mile", "10"), "16 kilometers");
    equal(nlp.convertImperialToSI("foot", "10"), "3 meters");
    equal(nlp.convertImperialToSI("yard", "10"), "9 meters");
    equal(nlp.convertImperialToSI("gallon", "10"), "37.9 liters");
    equal(nlp.convertImperialToSI("ounce", "10"), "283 grams");
    equal(nlp.convertImperialToSI("oz", "10"), "283 grams");
    equal(nlp.convertImperialToSI("pound", "10"), "4.54 kilograms");
    equal(nlp.convertImperialToSI("inch", "10"), "25.4 centimeters");
    equal(nlp.convertImperialToSI("in", "10"), "25.4 centimeters");

    equal(nlp.convertImperialToSI("disexisting-unit", "10"), "10 disexisting-unit");
});

test("reduction", function() {
    var tests = {
        "miles": "miles",
        "foot": "foot",
        "feet": "feet",
        "ft": "foot",
        "fahrenheit": "fahrenheit",
        "yards": "yards",
        "gallons": "gallons",
        "ounce": "ounce",
        "oz": "ounce",
        "pounds": "pounds",
        "inches": "inches",
        "inch": "inch",
        "in": "inch"
    }
    equal(Object.keys(tests).length, nlp.unitsForRegex.length);
    for (var key in tests) {
        equal(nlp.reduceImperialUnitNames(key), tests[key]);
    }
});

test("singularization", function() {
    var str = "mile miles foot feet fahrenheit fahrenheits yard yards "
        + "gallon gallons ounce ounces pound pounds inch inches";
    var exp = "mile mile foot foot fahrenheit fahrenheit yard yard "
        + "gallon gallon ounce ounce pound pound inch inch";
    equal(nlp.singularizeUnits(str), exp);
});

module("Rounding Tests");

test("basic rounding heuristics", function() {
    deepEqual(nlp.roundDecimal("056000000000001", 2), {decimal: "06", carry: 0});
    deepEqual(nlp.roundDecimal("056000000000001", 3), {decimal: "056", carry: 0});
    deepEqual(nlp.roundDecimal("056000000000001", 5), {decimal: "056", carry: 0});
    deepEqual(nlp.roundDecimal("056009000000001", 5), {decimal: "05601", carry: 0});
    deepEqual(nlp.roundDecimal("056003000000001", 5), {decimal: "056", carry: 0});
    deepEqual(nlp.roundDecimal("956", 1), {decimal: "", carry: 1});
    deepEqual(nlp.roundDecimal("1", 3), {decimal: "1", carry: 0});
    deepEqual(nlp.roundDecimal("100", 3), {decimal: "1", carry: 0});

    equal(nlp.roundForReadability(0.5), 0.5);
    equal(nlp.roundForReadability(0.55), 0.55);
    equal(nlp.roundForReadability(0.555), 0.56);
    equal(nlp.roundForReadability(0.553), 0.55);
    equal(nlp.roundForReadability(0.999), 1);
    equal(nlp.roundForReadability(5), 5);
    equal(nlp.roundForReadability(5.056000000000001), 5.06);
    equal(nlp.roundForReadability(7.996), 8);
    equal(nlp.roundForReadability(9.996), 10);
    equal(nlp.roundForReadability(10.056000000000001), 10.1);
    equal(nlp.roundForReadability(25.056000000000001), 25.1);
    equal(nlp.roundForReadability(25.956), 26);
    equal(nlp.roundForReadability(125.956), 126);
    equal(nlp.roundForReadability(125.1), 125);
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
        results = nlp.multisearch(testCase.text)
        equal(results.length, testCase.expected.length,
            "results length must match for test '" + testCase.text + "'");
        for (var i = 0; i < results.length; ++i) {
            deepEqual(results[i], testCase.expected[i],
                testCase.text + ". " + i + "th search");
        }
    });
});

module("Text scraper");

test("get all text nodes", function() {
    var cases = [
        {
            input: "<p>This is text.</p>",
            expected: ["This is text."]
        },
        {
            input: "<p>This is <strong>another</strong> text.</p>",
            expected: ["This is ", "another", " text."]
        },
        {
            input: "<p>The temperature was <strong>100</strong> degrees Fahrenheit.</p>",
            expected: ["The temperature was ", "100", " degrees Fahrenheit."]
        },
        {
            input: "<p>They walked 100 <strong>miles</strong>!</p>",
            expected: ["They walked 100 ", "miles", "!"]
        }
    ];
    cases.forEach(function(testCase) {
        var div = document.createElement('div');
        div.innerHTML = testCase.input;
        var resultNodes = nlp.getAllTextNodes(div);
        var resultText = [];
        resultNodes.forEach(function(node) {
            resultText.push(node.nodeValue);
        });
        deepEqual(resultText, testCase.expected, testCase.input);
    });
});

module("Multireplacer");

test("replace all text nodes", function() {
    var cases = [
        {
            text: "",
            matches: [],
            expected: []
        },
        {
            text: "nothing",
            matches: [],
            expected: [
                {
                    text: "nothing",
                    span: false
                }
            ]
        },
        {
            text: "foo 1 mile 2 miles 3 miles baz",
        //         012345678901234567890123456789
        //                   1         2
            matches: [
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
            ],
            expected: [
                {
                    text: "foo ",
                    span: false
                },
                {
                    text: "1.6 kilometers",
                    span: true
                },
                {
                    text: " ",
                    span: false
                },
                {
                    text: "3.2 kilometers",
                    span: true
                },
                {
                    text: " ",
                    span: false
                },
                {
                    text: "4.8 kilometers",
                    span: true
                },
                {
                    text: " baz",
                    span: false
                }
            ]
        }
    ];
    cases.forEach(function(testCase) {
        deepEqual(nlp.splitBySearchResults(testCase.text, testCase.matches),
            testCase.expected);
    });
});
