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

    function getAllTextNodes(doc, elem) {
        var filter = NodeFilter.SHOW_TEXT,
            walker = doc.createTreeWalker(elem, filter, null, false),
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
            var textNodes = null,
                root = document.body;
            if (rq.rootElem) {
                root = document.getElementById(rq.rootElem);
            }
            textNodes = getAllTextNodes(document, root);
            log(nodesToIndexedArray(textNodes));
            chrome.runtime.sendMessage({
                method: "text-for-processing",
                data: nodesToIndexedArray(textNodes),
                uiState: rq.uiState
            }, function(response) {
                replaceTextNodes(document, textNodes, response, rq.uiState.highlight);
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
