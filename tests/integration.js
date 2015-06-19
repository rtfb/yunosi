module("Integration");

test("integration test, inline test data", function() {
    chrome.runtime.sendMessage = function(rq, contentReplacer) {
        equal(rq.method, "text-for-processing");
        nlp.backgroundMsgListener({
            method: "text-for-processing",
            data: rq.data,
            uiState: fillDefaults(rq.uiState, true)
        }, null, function(response) {
            deepEqual(response, [{
                "origNode": 0,
                "replacement": [{
                    "altered": true,
                    "text": "161 kilometers"
                }]
            }]);
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
        equal(td.childElementCount, 1);
        equal(td.children[0].tagName, "P");
        equal(td.children[0].children[0].tagName, "SPAN");
        equal(td.children[0].children[0].innerHTML, "161 kilometers");
    });
});
