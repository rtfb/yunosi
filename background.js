'use strict';

var pluralize = require('pluralize'),
    fsm = require('./fsmsearch.js'),
    debug = false;
pluralize.addIrregularRule('Celsius', 'Celsius');

function log(str, obj) {
    if (debug) {
        console.log(str + ": " + JSON.stringify(obj, null, 4));
    }
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

function convertUnit(imperial) {
    var unitMap = {
        "mile": "kilometer",
        "foot": "meter",
        "fahrenheit": "Celsius",
        "yard": "meter",
        "gallon": "liter",
        "ounce": "gram",
        "pound": "kilogram",
        "inch": "centimeter"
    };
    return unitMap[imperial];
}

function readableUnits(value, unit) {
    return pluralizeUnits(convertUnit(unit), value);
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
        converter = converters[reduceImperialUnitNames(units)];
    if (converter) {
        return roundForReadability(converter(value));
    }
    return value;
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

function getContinuousText(frag, match, reducedUnit) {
    var si = convertValueToSI(match.units, match.numeral);
    if (frag.match.indexOf("-") >= 0) {
        return si.toString() + "-" + convertUnit(reducedUnit);
    }
    return si.toString() + " " + readableUnits(si, reducedUnit);
}

function patchSingleNode(node, nodeIndex, matches) {
    var results = [],
        textIndex = 0;
    matches.forEach(function(match) {
        var si = convertValueToSI(match.units, match.numeral),
            reducedUnit = reduceImperialUnitNames(match.units);
        match.fragments.forEach(function(frag) {
            if (frag.origNode !== nodeIndex) {
                return;
            }
            if (textIndex < frag.index) {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: node.substring(textIndex, frag.index),
                        altered: false
                }});
            }
            textIndex = frag.index + frag.match.length;
            if (match.continuous) {
                results.push({
                    origNode: frag.origNode,
                    replacement: {
                        text: getContinuousText(frag, match, reducedUnit),
                        altered: true
                }});
                return;
            }
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
                        text: readableUnits(si, reducedUnit),
                        altered: true
                }});
            }
        });
    });
    if (textIndex < node.length) {
        results.push({
            origNode: nodeIndex,
            replacement: {
                text: node.substring(textIndex),
                altered: false
        }});
    }
    return results;
}

function substituteBySearchResults(nodes, nodeMap) {
    var results = [];
    nodes.forEach(function(node) {
        if (nodeMap.hasOwnProperty(node.index)) {
            var idx = node.index,
                arr = patchSingleNode(node.text, idx, nodeMap[idx]);
            Array.prototype.push.apply(results, arr);
        }
    });
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

function processText(data) {
    var fsmResults = null,
        subst = null,
        coalesced = null;
    log("text-for-processing", data);
    fsmResults = fsm.search(data);
    log("fsm search results", fsmResults);
    subst = substituteBySearchResults(data, resultsToNodeMap(fsmResults));
    log("fsm processed results", subst);
    coalesced = coalesce(subst);
    log("coalesced results", coalesced);
    return coalesced;
}

chrome.runtime.onMessage.addListener(function(rq, sender, sendResponse) {
    var value = {};
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
        sendResponse(processText(rq.data));
    } else {
        sendResponse({error: true});
    }
    return true;
});

module.exports = {
    reduceImperialUnitNames: reduceImperialUnitNames,
    unitsForRegex: fsm.unitsForRegex,
    convertValueToSI: convertValueToSI,
    singularizeUnits: fsm.singularizeUnits,
    roundForReadability: roundForReadability,
    roundDecimal: roundDecimal,
    pluralizeUnits: pluralizeUnits,
    splitWords: fsm.splitWords,
    fsmSearch: fsm.search,
    substituteBySearchResults: substituteBySearchResults,
    patchSingleNode: patchSingleNode,
    resultsToNodeMap: resultsToNodeMap
};
