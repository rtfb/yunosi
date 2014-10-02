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

function reduceImperialUnitNames(name) {
    if (name === "oz") {
        return "ounce";
    }
    if (name === "in") {
        return "inch";
    }
    return name;
}

function convertImperialToSI(units, value) {
    var converters = {
        "mile": function(value) {
            return milesToKilometers(value);
        },
        "foot": function(value) {
            return value * 0.3 + " meters";
        },
        "fahrenheit": function(value) {
            // TODO: make better rounding, for everything
            return Math.round((value - 32) / 1.8) + " Celsius";
        },
        "yard": function(value) {
            return value * 0.9 + " meters";
        },
        "gallon": function(value) {
            return value * 3.78541 + " liters";
        },
        "ounce": function(value) {
            return value * 28.3495 + " grams";
        },
        "pound": function(value) {
            return value * 0.453592 + " kilograms";
        },
        "inch": function(value) {
            return value * 2.54 + " centimeters";
        }
    };
    var converter = converters[reduceImperialUnitNames(units)];
    if (converter) {
        return converter(value);
    }
    return value + " " + units;
}
