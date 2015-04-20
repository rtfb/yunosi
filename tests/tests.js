module("Basic Tests");

test("conversions", function() {
    var tests = [
        {unit: "fahrenheit",       value: "-40",  expected: "-40"},
        {unit: "fahrenheit",       value: "33.8", expected: "1"},
        {unit: "mile",             value: "10",   expected: "16.1"},
        {unit: "foot",             value: "10",   expected: "3.05"},
        {unit: "yard",             value: "10",   expected: "9.14"},
        {unit: "gallon",           value: "10",   expected: "37.9"},
        {unit: "ounce",            value: "10",   expected: "283"},
        {unit: "oz",               value: "10",   expected: "283"},
        {unit: "pound",            value: "10",   expected: "4.54"},
        {unit: "inch",             value: "10",   expected: "25.4"},
        {unit: "in",               value: "10",   expected: "25.4"},
        {unit: "disexisting-unit", value: "10",   expected: "10"}
    ];
    tests.forEach(function(test) {
        equal(nlp.convertValueToSI(test.unit, test.value), test.expected);
    });
});

test("whitespace", function() {
    var tests = [
        {test: "\n\t\t\t\t\t  ", expected: true},
        {test: "\n\t\t\t\t\t", expected: true},
        {test: "\n\t\t\t\t\t\t", expected: true},
        {test: "\n\t  ", expected: true},
        {test: "› Full image and caption", expected: false},
        {test: "\n  ", expected: true},
        {test: "\n\t", expected: true}
    ];
    tests.forEach(function(test) {
        var tn = document.createTextNode(test.test);
        equal(content.isWhiteSpaceOnly(tn), test.expected);
    });
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

test("pluralization", function() {
    equal(nlp.pluralizeUnits('kilometer', 1), 'kilometer');
    equal(nlp.pluralizeUnits('kilometer', 5), 'kilometers');
    equal(nlp.pluralizeUnits('kilometer', 1.5), 'kilometers');
    equal(nlp.pluralizeUnits('kilometer', 0.7), 'kilometers');
    equal(nlp.pluralizeUnits('meter', 3), 'meters');
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
        var resultNodes = content.getAllTextNodes(div);
        var resultText = [];
        resultNodes.forEach(function(node) {
            resultText.push(node.nodeValue);
        });
        deepEqual(resultText, testCase.expected, testCase.input);
    });
});

module("FSM search");

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
        }
    ];
    cases.forEach(function(testCase) {
        deepEqual(nlp.splitWords(testCase.text), testCase.expected);
    });
});

test("searcher", function() {
    var nodes = [
        {nodeValue: "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition."},
        {nodeValue: "foo 1 mile 2 miles 3 miles baz"},
        {nodeValue: "A 100 bloody "},
        {nodeValue: "miles"},
        {nodeValue: "!"},
        {nodeValue: "The Black Bear Trail is 0.6 miles long"},
        {nodeValue: "The 1.35 mile self-guided nature trail"},
        {nodeValue: "fly 3,600 miles and walk 3 miles"},
        {nodeValue: "fly 100 yards and walk 1000 feet 40 Fahrenheit"},
        {nodeValue: "60-inch telescope, 12 inches, 1 inch"},
        {nodeValue: "2000 foo bar 25 miles"},
        {nodeValue: "2000 foo 25 miles"},
        {nodeValue: "build a 25-mile-diameter, 5,000-foot-tall lunar city"},
        {nodeValue: "Size: 25 miles in diameter/5,000 feet tall"}
    ],
    expected = [
        {
            numeral: 1,
            units: "mile",
            continuous: true,
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
            fragments: [
                {
                origNode: 5,
                index: 24,
                fragType: "numeral",
                match: "0.6 miles",
                }
            ]
        },
        {
            numeral: 1.35,
            units: "mile",
            continuous: true,
            fragments: [
                {
                origNode: 6,
                index: 4,
                fragType: "numeral",
                match: "1.35 mile",
                }
            ]
        },
        {
            numeral: 3600,
            units: "mile",
            continuous: true,
            fragments: [
                {
                origNode: 7,
                index: 4,
                fragType: "numeral",
                match: "3,600 miles",
                }
            ]
        },
        {
            numeral: 3,
            units: "mile",
            continuous: true,
            fragments: [
                {
                origNode: 7,
                index: 25,
                fragType: "numeral",
                match: "3 miles",
                }
            ]
        },
        {
            numeral: 100,
            units: "yard",
            continuous: true,
            fragments: [
                {
                origNode: 8,
                index: 4,
                fragType: "numeral",
                match: "100 yards",
                }
            ]
        },
        {
            numeral: 1000,
            units: "foot",
            continuous: true,
            fragments: [
                {
                origNode: 8,
                index: 23,
                fragType: "numeral",
                match: "1000 feet",
                }
            ]
        },
        {
            numeral: 40,
            units: "fahrenheit",
            continuous: true,
            fragments: [
                {
                origNode: 8,
                index: 33,
                fragType: "numeral",
                match: "40 Fahrenheit",
                }
            ]
        },
        {
            numeral: 60,
            units: "inch",
            continuous: true,
            fragments: [
                {
                origNode: 9,
                index: 0,
                fragType: "numeral",
                match: "60-inch",
                }
            ]
        },
        {
            numeral: 12,
            units: "inch",
            continuous: true,
            fragments: [
                {
                origNode: 9,
                index: 19,
                fragType: "numeral",
                match: "12 inches",
                }
            ]
        },
        {
            numeral: 1,
            units: "inch",
            continuous: true,
            fragments: [
                {
                origNode: 9,
                index: 30,
                fragType: "numeral",
                match: "1 inch",
                }
            ]
        },
        {
            numeral: 25,
            units: "mile",
            continuous: true,
            fragments: [
                {
                origNode: 10,
                index: 13,
                fragType: "numeral",
                match: "25 miles",
                }
            ]
        },
        {
            numeral: 25,
            units: "mile",
            continuous: true,
            fragments: [
                {
                origNode: 11,
                index: 9,
                fragType: "numeral",
                match: "25 miles",
                }
            ]
        },
        {
            numeral: 25,
            units: "mile",
            continuous: true,
            fragments: [{
                origNode: 12,
                index: 8,
                fragType: "numeral",
                match: "25-mile"
            }]
        },
        {
            numeral: 5000,
            units: "foot",
            continuous: true,
            fragments: [{
                origNode: 12,
                index: 26,
                fragType: "numeral",
                match: "5,000-foot"
            }]
        },
        {
            numeral: 25,
            units: "mile",
            continuous: true,
            fragments: [{
                origNode: 13,
                index: 6,
                fragType: "numeral",
                match: "25 miles"
            }]
        },
        {
            numeral: 5000,
            units: "foot",
            continuous: true,
            fragments: [{
                origNode: 13,
                index: 27,
                fragType: "numeral",
                match: "5,000 feet"
            }]
        }
    ],
        actual = nlp.fsmSearch(content.nodesToIndexedArray(nodes));
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
        {nodeValue: "This turns the ESP8266 into something much better than a UART"},
        {nodeValue: "create a Internet of Things thing with just $5 in hardware"},
        // A bug used to match this, treating "." as a malformed number and
        // "In" as inches. Adding this negative test here to guard against
        // regressions:
        {nodeValue: "follow. Instead"}
    ],
        actual = nlp.fsmSearch(content.nodesToIndexedArray(tests));
    equal(actual.length, 0,
        "expected no results, but got " + JSON.stringify(actual, null, 4));
});

test("substitute", function() {
    var nodes = [
        {nodeValue: "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition."},
        {nodeValue: "foo"},
        {nodeValue: "A 100 bloody "},
        {nodeValue: "miles"},
        {nodeValue: "!"},
        {nodeValue: "foo 1 mile 2 miles 3 miles baz"}
    ],
        fsmProcessedResults = [
        {
            "numeral": 100,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 2,
                    "index": 2,
                    "fragType": "numeral",
                    "match": "100"
                },
                {
                    "origNode": 3,
                    "index": 0,
                    "fragType": "unit",
                    "match": "miles"
                }
            ]
        },
        {
            "numeral": 1,
            "units": "mile",
            continuous: true,
            "fragments": [{
                "origNode": 5,
                "index": 4,
                "fragType": "numeral",
                "match": "1 mile"
            }]
        },
        {
            "numeral": 2,
            "units": "mile",
            continuous: true,
            "fragments": [{
                "origNode": 5,
                "index": 11,
                "fragType": "numeral",
                "match": "2 miles"
            }]
        },
        {
            "numeral": 3,
            "units": "mile",
            continuous: true,
            "fragments": [{
                "origNode": 5,
                "index": 19,
                "fragType": "numeral",
                "match": "3 miles"
            }]
        }
    ],
        expected = [
        {
            origNode: 2,
            replacement: {
                altered: false,
                text: "A "
            }
        },
        {
            origNode: 2,
            replacement: {
                altered: true,
                text: "161"
            }
        },
        {
            origNode: 2,
            replacement: {
                altered: false,
                text: " bloody "
            }
        },
        {
            origNode: 3,
            replacement: {
                altered: true,
                text: "kilometers"
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: false,
                text: "foo "
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: true,
                text: "1.61 kilometers"
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: false,
                text: " "
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: true,
                text: "3.22 kilometers"
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: false,
                text: " "
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: true,
                text: "4.83 kilometers"
            }
        },
        {
            origNode: 5,
            replacement: {
                altered: false,
                text: " baz"
            }
        }
    ],
        arr = content.nodesToIndexedArray(nodes),
        nodeMap = nlp.resultsToNodeMap(fsmProcessedResults),
        actual = nlp.substituteBySearchResults(arr, nodeMap);
    deepEqual(actual, expected);
});

module("Result Substitution");

test("substitute in one node", function() {
    var nodes = [
        {nodeValue: ""},
        {nodeValue: "x"},
        {nodeValue: "!"},
        {nodeValue: "foo"},
        {nodeValue: "mile"},
        {nodeValue: "1 mile"},
        {nodeValue: "1 mile, 2 miles"},
        {nodeValue: "foo 1 mile baz"},
        {nodeValue: "25-mile-diameter"}
    ],
        fsmProcessedResults = [
        {
            "numeral": 1,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 5,
                    "index": 0,
                    "fragType": "numeral",
                    "match": "1"
                },
                {
                    "origNode": 5,
                    "index": 2,
                    "fragType": "unit",
                    "match": "mile"
                }
            ]
        },
        {
            "numeral": 1,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 6,
                    "index": 0,
                    "fragType": "numeral",
                    "match": "1"
                },
                {
                    "origNode": 6,
                    "index": 2,
                    "fragType": "unit",
                    "match": "mile"
                }
            ]
        },
        {
            "numeral": 2,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 6,
                    "index": 8,
                    "fragType": "numeral",
                    "match": "2"
                },
                {
                    "origNode": 6,
                    "index": 10,
                    "fragType": "unit",
                    "match": "miles"
                }
            ]
        },
        {
            "numeral": 1,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 7,
                    "index": 4,
                    "fragType": "numeral",
                    "match": "1"
                },
                {
                    "origNode": 7,
                    "index": 6,
                    "fragType": "unit",
                    "match": "mile"
                }
            ]
        },
        {
            numeral: 25,
            units: "mile",
            continuous: true,
            fragments: [{
                origNode: 8,
                index: 0,
                fragType: "numeral",
                match: "25-mile"
            }]
        }
    ],
        expected = [
        {nodeValue: ""},
        {nodeValue: "x"},
        {nodeValue: "!"},
        {nodeValue: "foo"},
        {nodeValue: "mile"},
        {nodeValue: "1.61 kilometers"},
        {nodeValue: "1.61 kilometers, 3.22 kilometers"},
        {nodeValue: "foo 1.61 kilometers baz"},
        {nodeValue: "40.2-kilometer-diameter"}
    ],
        actual = null;
    nodes.forEach(function(node, i) {
        actual = nlp.patchSingleNode(node.nodeValue, i, fsmProcessedResults);
        actual = actual.map(function(item) {
            return item.replacement.text;
        });
        deepEqual({nodeValue: actual.join("")}, expected[i]);
    });
});

test("fsm result remapper", function() {
    var fsmResults = [
        {
            "numeral": 1,
            "units": "mile",
            "fragments": [
                {
                    "origNode": 5,
                    "index": 0,
                    "fragType": "numeral",
                    "match": "1"
                },
                {
                    "origNode": 5,
                    "index": 2,
                    "fragType": "unit",
                    "match": "mile"
                }
            ]
        },
        {
            "numeral": 1,
            "units": "mile",
            "fragments": [{
                "origNode": 3,
                "index": 4,
                "fragType": "numeral",
                "match": "1"
            }, {
                "origNode": 3,
                "index": 6,
                "fragType": "unit",
                "match": "mile"
            }]
        },
        {
            "numeral": 2,
            "units": "mile",
            "fragments": [{
                "origNode": 3,
                "index": 11,
                "fragType": "numeral",
                "match": "2"
            }, {
                "origNode": 3,
                "index": 13,
                "fragType": "unit",
                "match": "miles"
            }]
        },
        {
            "numeral": 3,
            "units": "mile",
            "fragments": [{
                "origNode": 3,
                "index": 19,
                "fragType": "numeral",
                "match": "3"
            }, {
                "origNode": 3,
                "index": 21,
                "fragType": "unit",
                "match": "miles"
            }]
        }
    ],
        expected = {
            "5": [fsmResults[0]],
            "3": [fsmResults[1], fsmResults[2], fsmResults[3]]
        };
    deepEqual(nlp.resultsToNodeMap(fsmResults), expected);
})
