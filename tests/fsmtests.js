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
    }];
    tests.forEach(function(test) {
        var actual = nlp.search(strArrToIndexedNodesArr([test.text]), {});
        equal(actual.length, test.expected.length);
        if (test.expected.length === 0) {
            return;
        }
        actual.forEach(function(item, i) {
            equal(1, item.fragments.length);
            equal(item.fragments[0].match, test.expected[i]);
        });
    });
});
