var content = (function() {
    'use strict';

    var debugLog = false,
        contentMsgListener;

    function log(msg) {
        if (debugLog) {
            if (typeof msg === "object") {
                msg = JSON.stringify(msg, 4, null);
            }
            console.log(msg);
        }
    }

    function isScriptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "SCRIPT") {
            return true;
        }
        return false;
    }

    function isWhiteSpaceOnly(node) {
        if (node.nodeValue.replace(/[\n\t ]+/, "") === "") {
            return true;
        }
        return false;
    }

    function getAllTextNodes(elem) {
        var filter = NodeFilter.SHOW_TEXT,
            walker = document.createTreeWalker(elem, filter, null, false),
            arr = [],
            node;
        while (walker.nextNode()) {
            node = walker.currentNode;
            if (node.parentNode && isScriptNode(node.parentNode)) {
                continue;
            }
            if (node.isElementContentWhitespace || isWhiteSpaceOnly(node)) {
                continue;
            }
            arr.push(node);
        }
        return arr;
    }

    function makeTextNode(text) {
        return document.createTextNode(text);
    }

    function makeSpanNode(text) {
        var span = document.createElement('span');
        span.setAttribute("style", "background-color: yellow; color: black;");
        span.appendChild(document.createTextNode(text));
        return span;
    }

    function makeTextOrSpanNode(data, highlight) {
        if (!data.altered || !highlight) {
            return makeTextNode(data.text);
        }
        return makeSpanNode(data.text);
    }

    function replaceTextNodes(origNodes, newData, highlight) {
        newData.forEach(function(result) {
            var origNode = origNodes[result.origNode],
                parentNode = origNode.parentNode;
            result.replacement.forEach(function(repl) {
                var newNode = makeTextOrSpanNode(repl, highlight);
                parentNode.insertBefore(newNode, origNode);
            });
            parentNode.removeChild(origNode);
        });
    }

    function nodesToIndexedArray(nodes) {
        return nodes.map(function(item, index) {
            return {
                index: index,
                text: item.nodeValue
            };
        });
    }

    contentMsgListener = function(rq, sender, sendResponse) {
        if (rq.method === "convert-to-si") {
            var textNodes = null;
            if (rq.rootElem) {
                textNodes = getAllTextNodes(document.getElementById(rq.rootElem));
            } else {
                textNodes = getAllTextNodes(document.body);
            }
            log(nodesToIndexedArray(textNodes));
            chrome.runtime.sendMessage({
                method: "text-for-processing",
                data: nodesToIndexedArray(textNodes),
                uiState: rq.uiState
            }, function(response) {
                replaceTextNodes(textNodes, response, rq.uiState.highlight);
                sendResponse({"text": "ok"});
            });
        }
    };

    chrome.runtime.onMessage.addListener(contentMsgListener);

    return {
        makeTextOrSpanNode: makeTextOrSpanNode,
        isWhiteSpaceOnly: isWhiteSpaceOnly,
        isScriptNode: isScriptNode,
        getAllTextNodes: getAllTextNodes,
        nodesToIndexedArray: nodesToIndexedArray,
        contentMsgListener: contentMsgListener
    };
}());
