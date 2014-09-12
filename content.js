function textNodesUnder(el) {
    var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) {
        a.push(n);
        console.log("text node: " + n);
    }
    return a;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method && (request.method === "highlightImperial")) {
        // (Note: You can't send back the current '#document',
        //  because it is recognised as a circular object and
        //  cannot be converted to a JSON string.)
        var html = document.all[0];
        //sendResponse({ "htmlContent": html.innerHTML });
        //sendResponse({"text": textNodesUnder(document.body)});
        //textNodesUnder(document.body);
        document.body.innerHTML = highlight(document.body.innerHTML, "Spanish");
        sendResponse({"text": "ok"});
    } else if (request.method && (request.method === "convertToSI")) {
        // (Note: You can't send back the current '#document',
        //  because it is recognised as a circular object and
        //  cannot be converted to a JSON string.)
        var html = document.all[0];
        document.body.innerHTML = html.innerHTML.replace("Spanish", "Polish");
        sendResponse({"text": "ok"});
    }
});

function searchImperial(where) {
    var re = /[0-9,]+\s+miles?/i;
    var index = where.search(re);
    if (index >= 0) {
        return index;
    }
    return where.indexOf("mile");
}

function multisearch(where) {
    var re = /[0-9,]+\s+miles?/ig;
    var result;
    var results = [];
    while ((result = re.exec(where)) !== null) {
        results.push({
            index: result.index,
            match: result[0],
            numeral: parseInt(result[0].split()[0])
        });
    }
    return results;
}

function highlight(where, text) {
    var index = where.indexOf(text);
    if (index >= 0) {
        return where.substring(0, index)
            + "<span style='background-color: yellow;'>"
            + where.substring(index, index + text.length)
            + "</span>"
            + where.substring(index + text.length);
    }
    return where;
}
