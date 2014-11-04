(function () {
    'use strict';

    function log(str, obj) {
        console.log(str + ": " + JSON.stringify(obj, null, 4));
    }

    chrome.runtime.onMessage.addListener(function(rq, sender, sendResponse) {
        if (rq.method === "checkbox-state") {
            var value = {};
            value[rq.id] = rq.state;
            chrome.storage.local.set(value, function () {
                log("chrome.storage.local.set", rq);
            });
            sendResponse({success: true});
        } else if (rq.method === "get-ui-state") {
            // get(null) retrieves whole storage
            chrome.storage.local.get(null, function (result) {
                log("chrome.storage.local.get", result);
                sendResponse(result);
            });
        } else {
            sendResponse({error: true});
        }
        return true;
    });
}());
