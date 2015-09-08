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
        "ft": "foot",
        "lb": "pound",
        "lbs": "pound"
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

function dim(factor, dimension) {
    if (dimension > 1) {
        return Math.pow(factor, dimension);
    }
    return factor;
}

function convertValueToSI(units, value, dimension) {
    var converters = {
        "mile": function(value, dimension) {
            return value * dim(1.60934, dimension);
        },
        "foot": function(value, dimension) {
            return value * dim(0.3048, dimension);
        },
        "inch": function(value, dimension) {
            return value * dim(2.54, dimension);
        },
        "yard": function(value, dimension) {
            return value * dim(0.9144, dimension);
        },
        "fahrenheit": function(value, dimension) {
            return Math.round((value - 32) / 1.8);
        },
        "gallon": function(value, dimension) {
            return value * 3.78541;
        },
        "ounce": function(value, dimension) {
            return value * 28.3495;
        },
        "pound": function(value, dimension) {
            return value * 0.453592;
        }
    },
        converter = converters[reduceImperialUnitNames(units)];
    if (converter) {
        return roundForReadability(converter(value, dimension));
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
    if (newItem.origNode !== -1) {
        result.push(newItem);
    }
    return result;
}

function getContinuousText(frag, match, reducedUnit) {
    var si = convertValueToSI(match.units, match.numeral, match.dimension),
        separator = " ",
        dimension = "",
        units = "";
    if (frag.match.indexOf("-") >= 0) { // XXX: this test will match negative number!
        separator = "-";
        units = convertUnit(reducedUnit);
    } else {
        units = readableUnits(si, reducedUnit);
    }
    if (match.dimension === 2) {
        dimension = "square" + separator;
    } else if (match.dimension === 3) {
        dimension = "cubic" + separator;
    }
    return si.toString() + separator + dimension + units;
}

function patchSingleNode(node, nodeIndex, matches) {
    var results = [],
        textIndex = 0;
    matches.forEach(function(match) {
        var si = convertValueToSI(match.units, match.numeral, match.dimension),
            reducedUnit = reduceImperialUnitNames(match.units);
        match.fragments.some(function(frag, i) {
            if (frag.origNode !== nodeIndex) {
                return false;
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
                // grok remaining frags:
                textIndex += match.fragments.slice(i + 1).reduce(function(acc, frag) {
                    return acc + frag.match.length + 1;
                }, 0);
                return true;
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

function processText(data, uiState) {
    var fsmResults = null,
        subst = null,
        coalesced = null;
    log("text-for-processing", data);
    fsmResults = fsm.search(data, uiState.ui);
    log("fsm search results", fsmResults);
    subst = substituteBySearchResults(data, resultsToNodeMap(fsmResults));
    log("fsm processed results", subst);
    coalesced = coalesce(subst);
    log("coalesced results", coalesced);
    return coalesced;
}

var backgroundMsgListener = function(rq, sender, sendResponse) {
    var value = {},
        yunosiUrl = "http://github.com/rtfb/yunosi#readme";
    if (rq.method === "set-checkbox-state") {
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
        sendResponse(processText(rq.data, rq.uiState));
    } else if (rq.method === "show-readme") {
        chrome.tabs.create({url: yunosiUrl});
    } else {
        sendResponse({error: true});
    }
    return true;
};

chrome.runtime.onMessage.addListener(backgroundMsgListener);

module.exports = {
    isEmptyObject: fsm.isEmptyObject,
    strStartsWith: fsm.strStartsWith,
    constructUnitsRe: fsm.constructUnitsRe,
    allRegexpParts: fsm.allRegexpParts,
    regexPartsMap: fsm.regexPartsMap,
    singularizeUnits: fsm.singularizeUnits,
    splitWords: fsm.splitWords,
    search: fsm.search,
    isNumber: fsm.isNumber,
    isUnit: fsm.isUnit,
    interpretNum: fsm.interpretNum,

    convertValueToSI: convertValueToSI,
    reduceImperialUnitNames: reduceImperialUnitNames,
    roundForReadability: roundForReadability,
    roundDecimal: roundDecimal,
    pluralizeUnits: pluralizeUnits,
    substituteBySearchResults: substituteBySearchResults,
    patchSingleNode: patchSingleNode,
    resultsToNodeMap: resultsToNodeMap,
    backgroundMsgListener: backgroundMsgListener,
    coalesce: coalesce
};
