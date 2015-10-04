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
            root = document.body,
            resp = {
                "status": "ok"
            };
        if (rq.rootElem) {
            root = document.getElementById(rq.rootElem);
        }
        textNodes = scraper.getAllTextNodes(document, root);
        textNodesArr = scraper.nodesToIndexedArray(textNodes);
        chrome.runtime.sendMessage({
            method: "text-for-processing",
            data: textNodesArr,
            uiState: rq.uiState,
            debug: rq.debug
        }, function(response) {
            replacer.replaceTextNodes(document, textNodes, response, rq.uiState.highlight);
        });
        if (rq.debug) {
            resp.dump = JSON.stringify(textNodesArr, null, 4);
        }
        sendResponse(resp);
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
