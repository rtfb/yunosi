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

function readableUnits(value, unit) {
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
    return pluralizeUnits(siUnit, value);
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

function convertValueToSI(units, value) {
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
        return roundForReadability(converter(value));
    }
    return value;
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

function substituteBySearchResults(data, matches) {
    var results = [],
        textIndex = 0;
    matches.forEach(function(match) {
        var si = convertValueToSI(match.units, match.numeral),
            siUnit = readableUnits(si, reduceImperialUnitNames(match.units));
        match.fragments.forEach(function(frag) {
            var lastText = data[frag.origNode].text,
                plainText = "";
            if (textIndex < frag.index) {
                plainText = lastText.substring(textIndex, frag.index);
                console.log("plainText = '" + plainText + "' (" + textIndex + ", " + frag.index + ")");
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: plainText,
                        altered: false
                }});
            }
            textIndex = frag.index + frag.match.length;
            if (frag.fragType === "numeral") {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: si.toString(),
                        altered: true
                }});
            } else {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: siUnit,
                        altered: true
                }});
            }
            if (textIndex < lastText.length) {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: lastText.substring(textIndex),
                        altered: false
                }});
            }
        });
    });
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

function coalesce(data) {
    var result = [],
        newItem = {
            origNode: -1,
            replacement: []
        };
    data.forEach(function(item) {
        if (newItem.origNode === -1) {
            newItem.origNode = item.origNode;
            newItem.replacement.push(item.replacement);
            return;
        }
        if (newItem.origNode === item.origNode) {
            newItem.replacement.push(item.replacement);
            return;
        }
        result.push(newItem);
        newItem = {
            origNode: item.origNode,
            replacement: []
        };
        newItem.replacement.push(item.replacement);
    });
    result.push(newItem);
    return result;
}

function patchSingleNode(node, nodeIndex, matches) {
    var results = [],
        textIndex = 0,
        lastText = "";
    matches.forEach(function(match) {
        var si = convertValueToSI(match.units, match.numeral),
            siUnit = readableUnits(si, reduceImperialUnitNames(match.units));
        match.fragments.forEach(function(frag) {
            if (frag.origNode !== nodeIndex) {
                return;
            }
            var plainText = "";
            lastText = node;
            if (textIndex < frag.index) {
                plainText = lastText.substring(textIndex, frag.index);
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: plainText,
                        altered: false
                }});
            }
            textIndex = frag.index + frag.match.length;
            if (frag.fragType === "numeral") {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: si.toString(),
                        altered: true
                }});
            } else {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: siUnit,
                        altered: true
                }});
            }
            /*
            if (textIndex < lastText.length) {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: "<" + lastText.substring(textIndex) + ">",
                        altered: false
                }});
            }
            */
        });
    });
    if (results.length === 0) {
        results.push({
            origNode: nodeIndex,
            replacement: {
                text: node,
                altered: false
        }});
    }
    return results;
}

function resultsToNodeMap(fsmResults) {
    var dict = {};
    fsmResults.forEach(function(result) {
        result.fragments.forEach(function(frag) {
            if (!dict.hasOwnProperty(frag.origNode)) {
                dict[frag.origNode] = [result];
            } else {
                // XXX: this is quite inefficient:
                if (dict[frag.origNode].indexOf(result) === -1) {
                    dict[frag.origNode].push(result);
                }
            }
        });
    });
    return dict;
}

chrome.runtime.onMessage.addListener(function(rq, sender, sendResponse) {
    var value = {},
        fsmResults,
        tmp = null,
        tmp2 = null,
        tmp3 = null;
    if (rq.method === "checkbox-state") {
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
        fsmResults = fsm.search(rq.data);
        log("fsm search results", fsmResults);
        tmp = multisearchTextNodes(rq.data);
        log("multisearchTextNodes", tmp);
        tmp2 = substituteBySearchResults(rq.data, fsmResults);
        log("fsm processed results", tmp2);
        tmp3 = coalesce(tmp2);
        log("coalesced results", tmp3);
        sendResponse(tmp);
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
    splitWords: fsm.splitWords,
    fsmSearch: fsm.search,
    substituteBySearchResults: substituteBySearchResults,
    patchSingleNode: patchSingleNode,
    resultsToNodeMap: resultsToNodeMap
};
