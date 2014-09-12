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
