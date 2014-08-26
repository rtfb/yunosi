function textNodesUnder(el) {
    var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) {
        a.push(n);
        console.log("text node: " + n);
    }
    return a;
}

// Listen for message...
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("chrome.runtime.onMessage.addListener");
    // If the request asks for the DOM content...
    if (request.method && (request.method === "getDOM")) {
        // ...send back the content of the <html> element
        // (Note: You can't send back the current '#document',
        //  because it is recognised as a circular object and
        //  cannot be converted to a JSON string.)
        var html = document.all[0];
        //sendResponse({ "htmlContent": html.innerHTML });
        //sendResponse({"text": textNodesUnder(document.body)});
        //textNodesUnder(document.body);
        highlight("Spanish");
        sendResponse({"text": "ok"});
    }
});

function highlight(text) {
    var innerHTML = document.body.innerHTML;
    var index = innerHTML.indexOf(text);
    if (index >= 0) {
        innerHTML = innerHTML.substring(0, index)
            + "<span style='background-color: yellow;'>"
            + innerHTML.substring(index, index + text.length)
            + "</span>"
            + innerHTML.substring(index + text.length);
        document.body.innerHTML = innerHTML;
    }
}
