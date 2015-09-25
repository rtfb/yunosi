'use strict';

var debugLog = false,
    contentMsgListener,
    scraper = require("./scrape.js"),
    replacer = require("./replace.js");

function log(msg) {
    if (debugLog) {
        if (typeof msg === "object") {
            msg = JSON.stringify(msg, 4, null);
        }
        console.log(msg);
    }
}

contentMsgListener = function(rq, sender, sendResponse) {
    if (rq.method === "convert-to-si") {
        var textNodes = null,
            textNodesArr,
            root = document.body;
        if (rq.rootElem) {
            root = document.getElementById(rq.rootElem);
        }
        textNodes = scraper.getAllTextNodes(document, root);
        if (rq.debug) {
            textNodesArr = scraper.nodesToIndexedArray(textNodes);
            sendResponse({
                "text": JSON.stringify(textNodesArr, null, 4)
            });
        }
        chrome.runtime.sendMessage({
            method: "text-for-processing",
            data: scraper.nodesToIndexedArray(textNodes),
            uiState: rq.uiState
        }, function(response) {
            replacer.replaceTextNodes(document, textNodes, response, rq.uiState.highlight);
            sendResponse({"text": "ok"});
        });
    }
};

chrome.runtime.onMessage.addListener(contentMsgListener);

module.exports = {
    makeTextOrSpanNode: replacer.makeTextOrSpanNode,
    isWhiteSpaceOnly: scraper.isWhiteSpaceOnly,
    isScriptNode: scraper.isScriptNode,
    getAllTextNodes: scraper.getAllTextNodes,
    nodesToIndexedArray: scraper.nodesToIndexedArray,
    contentMsgListener: contentMsgListener
};
