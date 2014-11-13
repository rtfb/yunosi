var content = (function() {
    'use strict';

    function isScriptNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        if (node.nodeName === "SCRIPT") {
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

    function makeTextOrSpanNode(data, highlight) {
        if (!data.altered || !highlight) {
            return document.createTextNode(data.text);
        }
        var span = document.createElement('span');
        span.setAttribute("style", "background-color: yellow;");
        span.appendChild(document.createTextNode(data.text));
        return span;
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

    function prepareJson(nodes) {
        var ret = [],
            i = 0;
        for (i = 0; i < nodes.length; i += 1) {
            ret.push({
                index: i,
                text: nodes[i].nodeValue
            });
        }
        return ret;
    }

    chrome.runtime.onMessage.addListener(function(rq, sender, sendResponse) {
        if (rq.method && (rq.method === "convert-to-si")) {
            var textNodes = getAllTextNodes(document.body);
            chrome.runtime.sendMessage({
                method: "text-for-processing",
                data: prepareJson(textNodes)
            }, function(response) {
                console.log("response: " + JSON.stringify(response, null, 4));
                replaceTextNodes(textNodes, response, rq.highlight);
                sendResponse({"text": "ok"});
            });
        }
    });

    return {
        isWhiteSpaceOnly: isWhiteSpaceOnly,
        getAllTextNodes: getAllTextNodes
    };
}());
