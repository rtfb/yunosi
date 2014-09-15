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
        document.body.innerHTML = highlight(document.body.innerHTML, null);
        sendResponse({"text": "ok"});
    } else if (request.method && (request.method === "convertToSI")) {
        // (Note: You can't send back the current '#document',
        //  because it is recognised as a circular object and
        //  cannot be converted to a JSON string.)
        var html = document.all[0];
        document.body.innerHTML = replace(document.body.innerHTML);
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
    var re = /([0-9,]+)[\s-]*(miles?|foot|feet|fahrenheit|yards?|gallons?|ounce|oz|pounds?)/ig;
    var result;
    var results = [];
    while ((result = re.exec(where)) !== null) {
        results.push({
            index: result.index,
            match: result[0],
            units: singularizeUnits(result[2].toLowerCase()),
            numeral: interpretInt(result[1])
        });
    }
    return results;
}

function interpretInt(what) {
    what = what.replace(",", "");
    return parseInt(what);
}

function highlight(where, text) {
    if (text == null) {
        matches = multisearch(where);
        matches.forEach(function(match) {
            where = where.replace(match.match,
                "<span style='background-color: yellow;'>"
                + match.match
                + "</span>")
        });
        return where;
    }
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

function replace(where) {
    matches = multisearch(where);
    matches.forEach(function(match) {
        where = where.replace(match.match,
            "<span style='background-color: yellow;'>"
            + convertImperialToSI(match.units, match.numeral)
            + "</span>")
    });
    return where;
}

function milesToKilometers(miles) {
    return miles * 1.6 + " kilometers";
}

function singularizeUnits(units) {
    return units.replace("miles", "mile")
        .replace("feet", "foot")
        .replace("fahrenheits", "fahrenheit")
        .replace("yards", "yard")
        .replace("gallons", "gallon")
        .replace("ounces", "ounce")
        .replace("pounds", "pound");
}

function convertImperialToSI(units, value) {
    switch (units) {
        case "mile":
            return milesToKilometers(value);
        case "foot":
            return value * 0.3 + " meters";
        case "fahrenheit":
            return "";
        case "yard":
            return value * 0.9 + " meters";
        case "gallon":
            return value * 3.78541 + " liters";
        case "ounce":
        case "oz":
            return value * 28.3495 + " grams";
        case "pound":
            return value * 0.453592 + " kilograms";
        default:
            return value + " " + units;
    }
}
