'use strict';

var debugLog = false,
    contentMsgListener,
    scraper = require("./scrape.js");

function log(msg) {
    if (debugLog) {
        if (typeof msg === "object") {
            msg = JSON.stringify(msg, 4, null);
        }
        console.log(msg);
    }
}

function makeTextNode(doc, text) {
    return doc.createTextNode(text);
}

function makeSpanNode(doc, text) {
    var span = doc.createElement('span');
    span.setAttribute("style", "background-color: yellow; color: black;");
    span.appendChild(doc.createTextNode(text));
    return span;
}

function makeTextOrSpanNode(doc, data, highlight) {
    if (!data.altered || !highlight) {
        return makeTextNode(doc, data.text);
    }
    return makeSpanNode(doc, data.text);
}

function replaceTextNodes(doc, origNodes, newData, highlight) {
    newData.forEach(function(result) {
        var origNode = origNodes[result.origNode],
            parentNode = origNode.parentNode;
        result.replacement.forEach(function(repl) {
            var newNode = makeTextOrSpanNode(doc, repl, highlight);
            parentNode.insertBefore(newNode, origNode);
        });
        parentNode.removeChild(origNode);
    });
}

contentMsgListener = function(rq, sender, sendResponse) {
    if (rq.method === "convert-to-si") {
        var textNodes = null,
            root = document.body;
        if (rq.rootElem) {
            root = document.getElementById(rq.rootElem);
        }
        textNodes = scraper.getAllTextNodes(document, root);
        log(scraper.nodesToIndexedArray(textNodes));
        chrome.runtime.sendMessage({
            method: "text-for-processing",
            data: scraper.nodesToIndexedArray(textNodes),
            uiState: rq.uiState
        }, function(response) {
            replaceTextNodes(document, textNodes, response, rq.uiState.highlight);
            sendResponse({"text": "ok"});
        });
    }
};

chrome.runtime.onMessage.addListener(contentMsgListener);

module.exports = {
    makeTextOrSpanNode: makeTextOrSpanNode,
    isWhiteSpaceOnly: scraper.isWhiteSpaceOnly,
    isScriptNode: scraper.isScriptNode,
    getAllTextNodes: scraper.getAllTextNodes,
    nodesToIndexedArray: scraper.nodesToIndexedArray,
    contentMsgListener: contentMsgListener
};
