module("Integration");

function childEquals(testDataDiv, index, expected) {
    equal(testDataDiv.children[index].tagName, "P");
    equal(testDataDiv.children[index].children[0].tagName, "SPAN");
    equal(testDataDiv.children[index].children[0].innerHTML, expected);
}

test("integration test, inline test data", function() {
    chrome.runtime.sendMessage = function(rq, contentReplacer) {
        equal(rq.method, "text-for-processing");
        nlp.backgroundMsgListener({
            method: "text-for-processing",
            data: rq.data,
            uiState: fillDefaults(rq.uiState, true)
        }, null, function(response) {
            deepEqual(response[0], {
                "origNode": 0,
                "replacement": [{
                    "altered": true,
                    "text": "161 kilometers"
                }]
            });
            contentReplacer(response);
        });
    }
    content.contentMsgListener({
        method: "convert-to-si",
        rootElem: "test-data",
        uiState: {
            ui: {},
            highlight: true
        }
    }, null, function(response) {
        equal(response.text, "ok");
        var td = document.getElementById("test-data");
        equal(td.childElementCount, 2);
        childEquals(td, 0, "161 kilometers");
        childEquals(td, 1, "1.27-centimeter");
    });
});
