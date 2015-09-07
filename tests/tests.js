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

test("make nodes", function() {
    var tmp = document.createTextNode;
    document.createTextNode = function(text) {
        equal(text, "foo");
    }
    content.makeTextOrSpanNode({text: "foo"}, false);
    content.makeTextOrSpanNode({text: "foo", altered: false}, false);
    content.makeTextOrSpanNode({text: "foo", altered: false}, true);
    document.createTextNode = tmp;
    var elem = content.makeTextOrSpanNode({text: "foo", altered: true}, true);
    equal(elem.getAttribute("style"), "background-color: yellow; color: black;");
    equal(elem.tagName, "SPAN");
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
        "in": "inch",
        "lb": "pound"
    },
        allParts = nlp.allRegexpParts(nlp.regexPartsMap);
    equal(Object.keys(tests).length, allParts.length);
    for (var key in tests) {
        equal(nlp.reduceImperialUnitNames(key), tests[key]);
    }
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
    var tn = document.createTextNode('foo');
    equal(content.isScriptNode(tn), false);
});

module("Result Substitution");

test("substitute", function() {
    var nodes = [
        "The quick brown Lorem Ipsum didn't expect a Spanish Inquisition.",
        "foo",
        "A 100 bloody ",
        "miles",
        "!",
        "foo 1 mile 2 miles 3 miles baz"
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
        arr = strArrToIndexedNodesArr(nodes),
        nodeMap = nlp.resultsToNodeMap(fsmProcessedResults),
        actual = nlp.substituteBySearchResults(arr, nodeMap);
    deepEqual(actual, expected);
});

test("substitute in one node", function() {
    var nodes = [
        "",
        "x",
        "!",
        "foo",
        "mile",
        "1 mile",
        "1 mile, 2 miles",
        "foo 1 mile baz",
        "25-mile-diameter"
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
        "",
        "x",
        "!",
        "foo",
        "mile",
        "1.61 kilometers",
        "1.61 kilometers, 3.22 kilometers",
        "foo 1.61 kilometers baz",
        "40.2-kilometer-diameter"
    ];
    nodes.forEach(function(node, i) {
        var actual = nlp.patchSingleNode(node, i, fsmProcessedResults);
        equal(actual.map(function(item) {
            return item.replacement.text;
        }).join(""), expected[i]);
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

test("coalesce results", function() {
    var tests = [{
        data: [],
        expected: []
    }, {
        data: [{
            origNode: 1,
            replacement: {}
        }],
        expected: [{
            origNode: 1,
            replacement: [{}]
        }]
    }, {
        data: [{
            origNode: 1,
            replacement: {k: 'a'}
        }, {
            origNode: 1,
            replacement: {k: 'b'}
        }, {
            origNode: 2,
            replacement: {k: 'c'}
        }, {
            origNode: 1,
            replacement: {k: 'd'}
        }],
        expected: [{
            origNode: 1,
            replacement: [{k: 'a'}, {k: 'b'}]
        }, {
            origNode: 2,
            replacement: [{k: 'c'}]
        }, {
            origNode: 1,
            replacement: [{k: 'd'}]
        }]
    }];
    tests.forEach(function(test) {
        deepEqual(nlp.coalesce(test.data), test.expected);
    });
});

module("Messaging");

test("content listener", function() {
    chrome.runtime.sendMessage = function(rq, cb) {
        equal(rq.method, "text-for-processing");
        cb([]);
    }
    content.contentMsgListener({
        method: "convert-to-si",
        uiState: {
            highlight: true
        }
    }, null, function(response) {
        equal(response.text, "ok");
    });
});

test("background listener: set-checkbox-state", function() {
    chrome.storage.local.set = function(value, cb) {
        equal(value["goo"], "foo");
        cb();
    };
    nlp.backgroundMsgListener({
        method: "set-checkbox-state",
        id: "goo",
        state: "foo"
    }, null, function(response) {
        equal(response.success, true);
    });
});

test("background listener: get-ui-state", function() {
    chrome.storage.local.get = function(rq, cb) {
        equal(rq, null);
        cb({result: "synthetic"});
    };
    nlp.backgroundMsgListener({
        method: "get-ui-state"
    }, null, function(response) {
        equal(response.result, "synthetic");
    });
});

test("background listener: text-for-processing", function() {
    nlp.backgroundMsgListener({
        method: "text-for-processing",
        data: [{
            "index": 0,
            "text": "7 inches"
        }],
        uiState: {ui: {}}
    }, null, function(response) {
        deepEqual(response, [{
            "origNode": 0,
            "replacement": [{
                "altered": true,
                "text": "17.7 centimeters"
            }]
        }]);
    });
});

test("background listener: show-readme", function() {
    chrome.tabs.create = function(rq) {
        equal(rq.url, "http://github.com/rtfb/yunosi#readme");
    };
    nlp.backgroundMsgListener({
        method: "show-readme"
    }, null, function(response) {
        equal(response.success, true);
    });
});

test("background listener: unknown message", function() {
    nlp.backgroundMsgListener({
        method: "disexistant"
    }, null, function(response) {
        equal(response.error, true);
    });
});
