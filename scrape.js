'use strict';

function isWhiteSpaceOnly(node) {
    if (node.nodeValue.replace(/[\n\t ]+/, "") === "") {
        return true;
    }
    return false;
}

function isScriptNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "SCRIPT") {
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

function nodesToIndexedArray(nodes) {
    return nodes.map(function(item, index) {
        return {
            index: index,
            text: item.nodeValue
        };
    });
}

module.exports = {
    isWhiteSpaceOnly: isWhiteSpaceOnly,
    isScriptNode: isScriptNode,
    getAllTextNodes: getAllTextNodes,
    nodesToIndexedArray: nodesToIndexedArray
};
