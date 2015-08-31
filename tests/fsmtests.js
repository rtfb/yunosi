module("FSM");

test("simplified searcher", function() {
    var tests = [{
        text: "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition.",
        expected: []
    }, {
        text: "foo 1 mile 2 miles 3 miles baz",
        expected: ["1 mile", "2 miles", "3 miles"]
    }, {
        text: "The Black Bear Trail is 0.6 miles long",
        expected: ["0.6 miles"]
    }, {
        text: "The 1.35 mile self-guided nature trail",
        expected: ["1.35 mile"]
    }, {
        text: "fly 3,600 miles and walk 3 miles",
        expected: ["3,600 miles", "3 miles"]
    }, {
        text: "fly 100 yards and walk 1000 feet 40 Fahrenheit",
        expected: ["100 yards", "1000 feet", "40 Fahrenheit"]
    }, {
        text: "60-inch telescope, 12 inches, 1 inch",
        expected: ["60-inch", "12 inches", "1 inch"]
    }, {
        text: "2000 foo bar 25 miles",
        expected: ["25 miles"]
    }, {
        text: "2000 foo 25 miles",
        expected: ["25 miles"]
    }, {
        text: "build a 25-mile-diameter, 5,000-foot-tall lunar city",
        expected: ["25-mile", "5,000-foot"]
    }, {
        text: "Size: 25 miles in diameter/5,000 feet tall",
        expected: ["25 miles", "5,000 feet"]
    }, {
        text: "long, wide six-inch thick planks",
        expected: ["six-inch"]
    }, {
        text: "The three-inch-thick planks",
        expected: ["three-inch"]
    }, {
        text: "chop into ½-inch pieces",
        expected: ["½-inch"]
    }];
    tests.forEach(function(test) {
        var actual = nlp.search(strArrToIndexedNodesArr([test.text]), {});
        equal(actual.length, test.expected.length);
        if (test.expected.length === 0) {
            return;
        }
        actual.forEach(function(item, i) {
            equal(item.fragments.length, 1);
            equal(item.fragments[0].match, test.expected[i]);
        });
    });
});

test("searcher with dimensions", function() {
    var tests = [{
        text: "occupies 7 square miles",
        expected: {
            match: "7 miles",
            dim: 2
        }
    }, {
        text: "a square yard equals 9 square feet",
        expected: {
            match: "9 feet",
            dim: 2
        }
    }, {
        text: "two cubic feet",
        expected: {
            match: "two feet",
            dim: 3
        }
    }];
    tests.forEach(function(test) {
        var actual = nlp.search(strArrToIndexedNodesArr([test.text]), {});
        equal(actual.length, 1);
        equal(actual[0].fragments.length, 1);
        equal(actual[0].fragments[0].match, test.expected.match);
        equal(actual[0].dimension, test.expected.dim);
    });
});

test("split words", function() {
    var cases = [
        {
            text: "",
            expected: []
        },
        {
            text: "foo 1 mile 2 miles 3 miles baz",
            expected: [
                {index: 0, word: "foo"},
                {index: 4, word: "1"},
                {index: 6, word: "mile"},
                {index: 11, word: "2"},
                {index: 13, word: "miles"},
                {index: 19, word: "3"},
                {index: 21, word: "miles"},
                {index: 27, word: "baz"}
            ]
        },
        {
            text: "This turns the ESP8266 into something much better than a UART",
            expected: [
                {index: 0, word: "This"},
                {index: 5, word: "turns"},
                {index: 11, word: "the"},
                {index: 15, word: "ESP8266"},
                {index: 23, word: "into"},
                {index: 28, word: "something"},
                {index: 38, word: "much"},
                {index: 43, word: "better"},
                {index: 50, word: "than"},
                {index: 55, word: "a"},
                {index: 57, word: "UART"}
            ]
        },
        {
            text: "fly 3,600 miles, walk 3.0 miles.",
            expected: [
                {index: 0, word: "fly"},
                {index: 4, word: "3,600"},
                {index: 10, word: "miles"},
                {index: 17, word: "walk"},
                {index: 22, word: "3.0"},
                {index: 26, word: "miles"}
            ]
        },
        {
            text: "single_word...",
            expected: [
                {index: 0, word: "single_word"}
            ]
        },
        {
            text: "foo\n     bar \n baz",
            expected: [
                {index: 0, word: "foo"},
                {index: 9, word: "bar"},
                {index: 15, word: "baz"}
            ]
        }
    ];
    cases.forEach(function(testCase) {
        deepEqual(nlp.splitWords(testCase.text), testCase.expected);
    });
});

test("searcher", function() {
    var nodes = [
        "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition.",
        "foo 1 mile 2 miles 3 miles baz",
        "A 100 bloody ",
        "miles",
        "!",
        "The Black Bear Trail is 0.6 miles long"
    ],
    expected = [
        {
            numeral: 1,
            units: "mile",
            continuous: true,
            dimension: 1,
            fragments: [
                {
                origNode: 1,
                index: 4,
                fragType: "numeral",
                match: "1 mile",
                }
            ]
        },
        {
            numeral: 2,
            units: "mile",
            continuous: true,
            dimension: 1,
            fragments: [
                {
                origNode: 1,
                index: 11,
                fragType: "numeral",
                match: "2 miles",
                }
            ]
        },
        {
            numeral: 3,
            units: "mile",
            continuous: true,
            dimension: 1,
            fragments: [
                {
                origNode: 1,
                index: 19,
                fragType: "numeral",
                match: "3 miles",
                }
            ]
        },
        {
            numeral: 100,
            units: "mile",
            continuous: false,
            dimension: 1,
            fragments: [
                {
                origNode: 2,
                index: 2,
                fragType: "numeral",
                match: "100",
                },
                {
                origNode: 3,
                index: 0,
                fragType: "unit",
                match: "miles"
                }
            ]
        },
        {
            numeral: 0.6,
            units: "mile",
            continuous: true,
            dimension: 1,
            fragments: [
                {
                origNode: 5,
                index: 24,
                fragType: "numeral",
                match: "0.6 miles",
                }
            ]
        }
    ],
        actual = nlp.search(strArrToIndexedNodesArr(nodes), {});
    if (actual.length != expected.length) {
        deepEqual(actual, expected);
    } else {
        actual.forEach(function(actualItem, i) {
            deepEqual(actualItem, expected[i]);
        });
    }
});

test("searcher, negative tests", function() {
    var tests = [
        "This turns the ESP8266 into something much better than a UART",
        "create a Internet of Things thing with just $5 in hardware",
        // A bug used to match this, treating "." as a malformed number and
        // "In" as inches. Adding this negative test here to guard against
        // regressions:
        "follow. Instead"
    ],
        actual = nlp.search(strArrToIndexedNodesArr(tests), {});
    equal(actual.length, 0,
        "expected no results, but got " + JSON.stringify(actual, null, 4));
});

test("search with options", function() {
    var nodes = [
        "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition.",
        "foo 1 mile 2 miles 3 miles baz",
        "A 100 bloody ",
        "miles",
        "!",
        "The Black Bear Trail is 0.6 miles long",
        "The 1.35 mile self-guided nature trail",
        "fly 3,600 miles and walk 3 miles",
        "fly 100 yards and walk 1000 feet 40 Fahrenheit",
        "60-inch telescope, 12 inches, 1 inch",
        "2000 foo bar 25 miles",
        "2000 foo 25 miles",
        "build a 25-mile-diameter, 5,000-foot-tall lunar city",
        "Size: 25 miles in diameter/5,000 feet tall"
    ],
        r = function(t) {
            return nlp.search(strArrToIndexedNodesArr(nodes), fillDefaults(t, false));
    };
    equal(r(null).length, 0);
    equal(r({"convert-miles": true}).length, 12);
    equal(r({
        "convert-miles": false,
        "convert-feet": true}).length, 3);
    /*
    XXX: this is a very interesting test case:
         turning miles OFF and inches ON, makes this string:
         "25 miles in diameter" to be treated as if it were
         "<number (25)>, <infix (miles)>, <units (in)>, <other (diameter)>".
         Frankly, I'm unsure what to do about this case (and possibly, some
         other equivalent cases). Always search for all possible units, but
         mark some results as not to be displayed?

    equal(r({
        "convert-miles": false,
        "convert-inches": true}).length, 3);
    */
});

test("singularization", function() {
    var str = "mile miles foot feet fahrenheit fahrenheits yard yards "
        + "gallon gallons ounce ounces pound pounds inch inches";
    var exp = "mile mile foot foot fahrenheit fahrenheit yard yard "
        + "gallon gallon ounce ounce pound pound inch inch";
    equal(nlp.singularizeUnits(str), exp);
});

test("helpers", function() {
    equal(nlp.isEmptyObject({}), true);
    equal(nlp.isEmptyObject("a"), false);
    equal(nlp.isEmptyObject(1), false);
    equal(nlp.isEmptyObject([]), true); // apparently...

    equal(nlp.strStartsWith("", ""), true);
    equal(nlp.strStartsWith("x", "x"), true);
    equal(nlp.strStartsWith("xxx", "x"), true);
    equal(nlp.strStartsWith("xxx", "a"), false);
});

test("units by UI state", function() {
    var allUnits = "miles?|foot|feet|ft|inches|inch|in|yards?|fahrenheit|gallons?|ounce|oz|pounds?|lbs?";
    equal(nlp.constructUnitsRe(), "");
    equal(nlp.constructUnitsRe({}), allUnits);
    equal(nlp.constructUnitsRe(fillDefaults({"convert-miles": true}, false)), "miles?");
    equal(nlp.constructUnitsRe({"goo": true}), allUnits);
    equal(nlp.constructUnitsRe({"quaff-gallons": true}), allUnits);
});

test("token detection: numbers", function() {
    var positives = [
        "17", "17.1", "one", "two", "three", "four", "five", "six", "seven",
        "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
        "1/2", "17/31", "3 / 4", "-2/5", "⅓", "⅗"
        ],
        negatives = [
            "foo", "17.1a", "z2/7"
        ];
    positives.forEach(function(t) {
        equal(nlp.isNumber(t), true, "isNumber(" + t + ")=false, expected true");
    });
    negatives.forEach(function(t) {
        equal(nlp.isNumber(t), false, "isNumber(" + t + ")=true, expected false");
    });
});

test("token detection: units", function() {
    var positives = [
        "mile", "miles", "feet", "fahrenheit", "Fahrenheit", "MILES",
        "gallons", "oz", "lb"
        ],
    negatives = [
        "zoo", "file", "parrot"
    ];
    nlp.search([], {}); // reset units regexp
    positives.forEach(function(t) {
        equal(nlp.isUnit(t), true, "isUnit(" + t + ")=false, expected true");
    });
    negatives.forEach(function(t) {
        equal(nlp.isUnit(t), false, "isUnit(" + t + ")=true, expected false");
    });
});

test("number interpretation", function() {
    var tests = [
        {t: "1", e: 1},
        {t: "17", e: 17},
        {t: "1.7", e: 1.7},
        {t: ".7", e: 0.7},
        {t: "one", e: 1},
        {t: "seventeen", e: 17},
        {t: "1/2", e: 0.5},
        {t: "3/4", e: 0.75},
        {t: "⅓", e: 1/3},
        {t: "⅘", e: 0.8}
    ];
    tests.forEach(function(t) {
        equal(nlp.interpretNum(t.t), t.e);
    });
});
