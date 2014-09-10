module("Basic Tests");

test("highlight", function() {
    var html = "<body><p>foo</p></body>";
    var result = highlight(html, "foo");
    equal(result, "<body><p><span style='background-color: yellow;'>foo</span></p></body>");
});
