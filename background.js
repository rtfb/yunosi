'use strict';

var unitsForRegex = [
    "miles?",
    "foot",
    "feet",
    "ft",
    "fahrenheit",
    "yards?",
    "gallons?",
    "ounce",
    "oz",
    "pounds?",
    "inches",
    "inch",
    "in"
],
    pluralize = require('pluralize'),
    fsm = require('./fsmsearch.js');
pluralize.addIrregularRule('Celsius', 'Celsius');

function log(str, obj) {
    console.log(str + ": " + JSON.stringify(obj, null, 4));
}

function reduceImperialUnitNames(name) {
    var abbrevs = {
        "oz": "ounce",
        "in": "inch",
        "ft": "foot"
    };
    if (abbrevs.hasOwnProperty(name)) {
        return abbrevs[name];
    }
    return name;
}

function roundDecimal(decimalStr, pos) {
    var dec = decimalStr.substring(0, pos).replace(/0+$/g, ''),
        trailing = decimalStr.substring(pos, pos + 1),
        rounded,
        carry = 0;
    if (trailing && parseInt(trailing, 10) >= 5) {
        rounded = parseFloat("0." + dec) + Math.pow(10, -pos);
        if (rounded >= 1.0) {
            carry = 1;
        }
        return {
            decimal: rounded.toString().substring(2, 2 + pos),
            carry: carry
        };
    }
    return {
        decimal: dec,
        carry: 0
    };
}

function roundForReadability(num) {
    var strRepr = num.toString(),
        dot = strRepr.indexOf("."),
        parts,
        whole,
        numSigDigits = 0,
        roundResult,
        strResult;
    if (dot === -1) {
        return num;
    }
    parts = strRepr.split(".");
    whole = parseInt(parts[0], 10);
    if (whole < 100) {
        numSigDigits = 1;
    }
    if (whole < 10) {
        numSigDigits = 2;
    }
    roundResult = roundDecimal(parts[1], numSigDigits);
    strResult = (whole + roundResult.carry).toString();
    if (roundResult.decimal !== "") {
        strResult = strResult + "." + roundResult.decimal;
    }
    return strResult;
}

function pluralizeUnits(units, value) {
    return pluralize(units, value);
}

function makeReadable(value, unit) {
    var unitMap = {
        "mile": "kilometer",
        "foot": "meter",
        "fahrenheit": "Celsius",
        "yard": "meter",
        "gallon": "liter",
        "ounce": "gram",
        "pound": "kilogram",
        "inch": "centimeter"
    },
        siUnit = unitMap[unit];
    return roundForReadability(value) + " " + pluralizeUnits(siUnit, value);
}

function convertImperialToSI(units, value) {
    var converters = {
        "mile": function(value) {
            return value * 1.60934;
        },
        "foot": function(value) {
            return value * 0.3048;
        },
        "fahrenheit": function(value) {
            return Math.round((value - 32) / 1.8);
        },
        "yard": function(value) {
            return value * 0.9144;
        },
        "gallon": function(value) {
            return value * 3.78541;
        },
        "ounce": function(value) {
            return value * 28.3495;
        },
        "pound": function(value) {
            return value * 0.453592;
        },
        "inch": function(value) {
            return value * 2.54;
        }
    },
        reducedUnit = reduceImperialUnitNames(units),
        converter = converters[reducedUnit];
    if (converter) {
        return makeReadable(converter(value), reducedUnit);
    }
    return value + " " + units;
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

function interpretNum(what) {
    what = what.replace(",", "");
    return parseFloat(what);
}

function multisearch(where) {
    var units = unitsForRegex.join("|"),
        numberRe = "([\\d,]*\\.?\\d+)",
        re = new RegExp(numberRe + "[\\s-]*(" + units + ")", "gi"),
        result,
        results = [],
        preceding;
    while (true) {
        result = re.exec(where);
        if (result === null) {
            break;
        }
        if (result.index > 0) {
            preceding = where.substring(result.index - 1, result.index);
            // Only whitespace and punctuation can immediately precede the
            // number. Make sure that's the case:
            if (preceding.search(/[\s,.?!'"+\-]/) !== 0) {
                continue;
            }
        }
        results.push({
            index: result.index,
            match: result[0],
            units: singularizeUnits(result[2].toLowerCase()),
            numeral: interpretNum(result[1])
        });
    }
    return results;
}

function splitBySearchResults(text, matches) {
    var i = 0,
        match,
        plainText,
        si,
        textIndex = 0,
        results = [];
    while (i < matches.length) {
        match = matches[i];
        plainText = text.substring(textIndex, match.index);
        results.push({
            text: plainText,
            altered: false
        });

        si = convertImperialToSI(match.units, match.numeral);
        textIndex = match.index + match.match.length;
        results.push({
            text: si,
            altered: true
        });

        i += 1;
    }
    if (textIndex < text.length) {
        results.push({
            text: text.substring(textIndex),
            altered: false
        });
    }
    return results;
}

function multisearchTextNodes(nodes) {
    var resultArray = [];
    nodes.forEach(function(node) {
        var text = node.text,
            searchResults = multisearch(text);
        if (searchResults.length !== 0) {
            resultArray.push({
                origNode: node.index,
                replacement: splitBySearchResults(text, searchResults)
            });
        }
    });
    return resultArray;
}

function log(msg, data) {
    console.log(msg + ": " + JSON.stringify(data, null, 4));
}

chrome.runtime.onMessage.addListener(function(rq, sender, sendResponse) {
    if (rq.method === "checkbox-state") {
        var value = {};
        value[rq.id] = rq.state;
        chrome.storage.local.set(value, function () {
            log("chrome.storage.local.set", rq);
        });
        sendResponse({success: true});
    } else if (rq.method === "get-ui-state") {
        // get(null) retrieves whole storage
        chrome.storage.local.get(null, function (result) {
            log("chrome.storage.local.get", result);
            sendResponse(result);
        });
    } else if (rq.method === "text-for-processing") {
        log("text-for-processing", rq.data);
        log("fsm search results", fsm.search(rq.data));
        sendResponse(multisearchTextNodes(rq.data));
    } else {
        sendResponse({error: true});
    }
    return true;
});

module.exports = {
    reduceImperialUnitNames: reduceImperialUnitNames,
    unitsForRegex: unitsForRegex,
    convertImperialToSI: convertImperialToSI,
    singularizeUnits: singularizeUnits,
    multisearch: multisearch,
    multisearchTextNodes: multisearchTextNodes,
    roundForReadability: roundForReadability,
    roundDecimal: roundDecimal,
    splitBySearchResults: splitBySearchResults,
    pluralizeUnits: pluralizeUnits,
    splitWords: fsm.splitWords
};
