function textNodesUnder(el) {
    var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) {
        a.push(n);
        console.log("text node: " + n);
    }
    return a;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method && (request.method === "convertToSI")) {
        // (Note: You can't send back the current '#document',
        //  because it is recognised as a circular object and
        //  cannot be converted to a JSON string.)
        var html = document.body.innerHTML;
        document.body.innerHTML = replace(html, request.highlight);
        sendResponse({"text": "ok"});
    }
});

function multisearch(where) {
    var units = [
        "miles?",
        "foot",
        "feet",
        "fahrenheit",
        "yards?",
        "gallons?",
        "ounce",
        "oz",
        "pounds?",
        "inches",
        "inch",
        "in"
    ];
    var numberRe = "([\\d,]*\\.?\\d+)";
    var re = new RegExp(numberRe + "[\\s-]*(" + units.join("|") + ")", "gi");
    var result;
    var results = [];
    while ((result = re.exec(where)) !== null) {
        results.push({
            index: result.index,
            match: result[0],
            units: singularizeUnits(result[2].toLowerCase()),
            numeral: interpretNum(result[1])
        });
    }
    return results;
}

function interpretNum(what) {
    what = what.replace(",", "");
    return parseFloat(what);
}

function openSpan(highlight) {
    if (highlight) {
        return "<span style='background-color: yellow;'>";
    }
    return "";
}

function closeSpan(highlight) {
    if (highlight) {
        return "</span>";
    }
    return "";
}

function replace(where, highlight) {
    matches = multisearch(where);
    matches.forEach(function(match) {
        where = where.replace(match.match,
            openSpan(highlight)
            + convertImperialToSI(match.units, match.numeral)
            + closeSpan(highlight));
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
        .replace("pounds", "pound")
        .replace("inches", "inch");
}

function convertImperialToSI(units, value) {
    switch (units) {
        case "mile":
            return milesToKilometers(value);
        case "foot":
            return value * 0.3 + " meters";
        case "fahrenheit":
            // TODO: make better rounding, for everything
            return Math.round((value - 32) / 1.8) + " Celsius";
        case "yard":
            return value * 0.9 + " meters";
        case "gallon":
            return value * 3.78541 + " liters";
        case "ounce":
        case "oz":
            return value * 28.3495 + " grams";
        case "pound":
            return value * 0.453592 + " kilograms";
        case "inch":
        case "in":
            return value * 2.54 + " centimeters";
        default:
            return value + " " + units;
    }
}
