'use strict';

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

module.exports = {
    makeTextNode: makeTextNode,
    makeSpanNode: makeSpanNode,
    makeTextOrSpanNode: makeTextOrSpanNode,
    replaceTextNodes: replaceTextNodes
};
