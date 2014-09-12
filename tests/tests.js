module("Basic Tests");

test("highlight", function() {
    var html = "<body><p>foo</p></body>";
    var result = highlight(html, "foo");
    equal(result, "<body><p><span style='background-color: yellow;'>foo</span></p></body>");
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
                    numeral: 1
                },
                {
                    index: 11,
                    match: "2 miles",
                    numeral: 2
                },
                {
                    index: 19,
                    match: "3 miles",
                    numeral: 3
                }
            ]
        },
        {
            text: "fly 3,600 miles and walk 3 miles",
            expected: [
                {
                    index: 4,
                    match: "3,600 miles",
                    numeral: 3600
                },
                {
                    index: 25,
                    match: "3 miles",
                    numeral: 3
                }
            ]
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
