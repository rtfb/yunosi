(function () {
    'use strict';

    function log(str, obj) {
        console.log(str + ": " + JSON.stringify(obj, null, 4));
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "checkbox-state") {
            var value = {};
            value[request.id] = request.state;
            chrome.storage.local.set(value, function () {
                log("chrome.storage.local.set", request);
            });
            sendResponse({success: true});
        } else if (request.action === "get-ui-state") {
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
