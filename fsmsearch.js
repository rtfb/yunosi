// https://github.com/jakesgordon/javascript-state-machine
// npm install javascript-state-machine
'use strict';

var StateMachine = require("javascript-state-machine"),
    debugLog = false,
    regexPartsMap = {
        "convert-miles": ["miles?"],
        "convert-feet": ["foot", "feet", "ft"],
        "convert-inches": ["inches", "inch", "in"],
        "convert-yards": ["yards?"],
        "convert-fahrenheit": ["fahrenheit"],
        "convert-gallons": ["gallons?"],
        "convert-ounces": ["ounce", "oz"],
        "convert-pounds": ["pounds?", "lbs?"]
    },
    unitsRe = null,
    numerals = [
        "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"
    ],
    fractions = {
        "¼": "1/4",
        "½": "1/2",
        "¾": "3/4",
        "⅓": "1/3",
        "⅔": "2/3",
        "⅕": "1/5",
        "⅖": "2/5",
        "⅗": "3/5",
        "⅘": "4/5",
        "⅙": "1/6",
        "⅚": "5/6",
        "⅛": "1/8",
        "⅜": "3/8",
        "⅝": "5/8",
        "⅞": "7/8"
    },
    numeralsRe = new RegExp("\\b(" + numerals.join("|") + ")\\b", "gi");

function allRegexpParts(dict) {
    // Extract all values from a given dict (all have to be arrays) and squish
    // them together into a single array:
    return [].concat.apply([], Object.keys(dict).map(function(key) {
        return dict[key];
    }));
}

function isEmptyObject(obj) {
    if (typeof obj !== "object") {
        return false;
    }
    return Object.keys(obj).length === 0;
}

function strStartsWith(str, prefix) {
    return str.substr(0, prefix.length) === prefix;
}

function _compileUnitsRe(uiState) {
    var reParts = [];
    Object.keys(regexPartsMap).forEach(function(key) {
        if (uiState.hasOwnProperty(key)) {
            if (!uiState[key]) {
                return;
            }
            reParts = reParts.concat(regexPartsMap[key]);
        } else {
            reParts = reParts.concat(regexPartsMap[key]);
        }
    });
    return reParts.join("|");
}

function constructUnitsRe(uiState) {
    if (!uiState) {
        return "";
    }
    if (isEmptyObject(uiState)) {
        return allRegexpParts(regexPartsMap).join("|");
    }
    return _compileUnitsRe(uiState);
}

function compileUnitsRe(uiState) {
    return new RegExp(constructUnitsRe(uiState), "gi");
}

function log(msg) {
    if (debugLog) {
        console.log(msg);
    }
}

function fsmLog(prefix, evt, from, to, msg) {
    var details = '';
    if (msg) {
        if (typeof msg === "object") {
            msg = JSON.stringify(msg, 4, null);
        }
        details = ' (' + msg + ')';
    }
    log(prefix + evt + ', ' + from + ' -> ' + to + details);
}

function logEvt(evt, from, to, msg) {
    fsmLog('!! ', evt, from, to, msg);
}

function logState(evt, from, to, msg) {
    fsmLog('-- ', evt, from, to, msg);
}

function parseFraction(frac) {
    var parts = frac.split("/");
    return parseFloat(parts[0]) / parseFloat(parts[1]);
}

function hasSlash(word) {
    log("hasSlash: " + word);
    return word.search('/') !== -1;
}

function interpretNum(what) {
    var index = -1;
    what = what.replace(",", "");
    index = numerals.indexOf(what.toLowerCase());
    if (index !== -1) {
        return index + 1;
    }
    if (fractions.hasOwnProperty(what)) {
        return parseFraction(fractions[what]);
    }
    if (hasSlash(what)) {
        return parseFraction(what);
    }
    return parseFloat(what);
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

function mkMatch(state) {
    var frags = state.matchGroup.fragments;
    return frags[0].match + state.separator + frags[1].match;
}

function resetState(state) {
    state.matchGroup = {
        numeral: -1,
        units: "",
        continuous: true,
        fragments: []
    };
    state.separator = " ";
    state.dimension = 1;
}

function isOneOf(str, strs) {
    return strs.some(function(s) {
        return str === s;
    });
}

var state = {
    matchGroup: {
        numeral: -1,
        units: "",
        continuous: true,
        fragments: []
    },
    separator: " ",
    dimension: 1,
    resultSet: []
},
    fsm = StateMachine.create({
    initial: 'AnyWord',
    events: [
{name: 'number',    from: ['AnyWord', 'NumberFound',
                           'HaveNumAndInfix'],            to: 'NumberFound'},
{name: 'something', from: ['AnyWord', 'HaveNumAndInfix'], to: 'AnyWord'},
{name: 'something', from: 'NumberFound',                  to: 'HaveNumAndInfix'},
{name: 'unit',      from: 'NumberFound',                  to: 'End'},
{name: 'unit',      from: 'HaveNumAndInfix',              to: 'End'},
{name: 'unit',      from: 'AnyWord',                      to: 'AnyWord'},

{name: 'restart',   from: ['AnyWord', 'NumberFound', 'HaveNumAndInfix', 'End'], to: 'AnyWord'}
    ],
    callbacks: {
        onnumber: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            resetState(state);
            state.matchGroup.numeral = interpretNum(msg.word);
            state.matchGroup.fragments.push({
                origNode: msg.origNode,
                index: msg.index,
                fragType: "numeral",
                match: msg.word
            });
        },
        onunit: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            state.matchGroup.units = singularizeUnits(msg.word.toLowerCase());
            state.matchGroup.fragments.push({
                origNode: msg.origNode,
                index: msg.index,
                fragType: "unit",
                match: msg.word
            });
        },
        onsomething: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            var word = msg.word.toLowerCase();
            if (isOneOf(word, ["square", "sq", "sqr"])) {
                state.dimension = 2;
            } else if (isOneOf(word, ["cube", "cubic"])) {
                state.dimension = 3;
            } else {
                state.matchGroup.continuous = false;
            }
        },
        onAnyWord: function(evt, from, to, msg) {
            logState(evt, from, to, msg);
            resetState(state);
        },
        onNumberFound: logState,
        onleaveEnd: function(evt, from, to, msg) {
            logState(evt, from, to, msg);
            if (state.matchGroup.fragments.length !== 2) {
                return;
            }
            if (state.matchGroup.continuous) {
                state.matchGroup.fragments = [{
                    fragType: "numeral",
                    index: state.matchGroup.fragments[0].index,
                    match: mkMatch(state),
                    origNode: state.matchGroup.fragments[0].origNode
                }];
            }
            state.matchGroup.dimension = state.dimension;
            state.resultSet.push(state.matchGroup);
            log(">> yeah, " + state.matchGroup.numeral + " " + state.matchGroup.units + ".");
        },
        onrestart: function() {
            resetState(state);
        }
    }
});

function stripPunctuation(word) {
    var punct = "[.,?:!]+",
        reLeft = new RegExp("^" + punct),
        reRight = new RegExp(punct + "$");
    return word.replace(reLeft, "").replace(reRight, "");
}

function splitWordsBy(text, regexp) {
    if (!text || text === "") {
        return [];
    }
    var re = new RegExp(regexp, "g"),
        nonSpace = re.exec(text),
        result = [];
    while (nonSpace !== null) {
        result.push({
            index: nonSpace.index,
            word: stripPunctuation(nonSpace[0])
        });
        nonSpace = re.exec(text);
    }
    return result;
}

function splitWords(text) {
    return splitWordsBy(text, "([^\\s]+)");
}

function isFullMatch(word, re) {
    var match = word.match(re);
    if (match !== null && match.length === 1 && match[0] === word) {
        return true;
    }
    return false;
}

function isNumber(word) {
    log("isNumber: " + word);
    var numberRe = /-?\+?[\d,]*\.?\d+/g,
        fractionRe = /-?\+?\d+\s?\/\s?\d+/g,
        index = Object.keys(fractions).indexOf(word);
    if (index !== -1) {
        return true;
    }
    return isFullMatch(word, numberRe)
        || isFullMatch(word, fractionRe)
        || isFullMatch(word, numeralsRe);
}

function isUnit(word) {
    log("isUnit: " + word);
    return isFullMatch(word, unitsRe);
}

function hasDash(word) {
    log("hasDash: " + word);
    return word.search('-') !== -1;
}

function processDash(word, index, origNode) {
    log("processDash: " + word);
    var parts = word.split("-");
    if (parts.length < 2) {
        return;
    }
    if (isNumber(parts[0])) {
        fsm.number({
            word: parts[0],
            index: index,
            origNode: origNode
        });
    }
    if (isUnit(parts[1])) {
        state.separator = "-";
        fsm.unit({
            word: parts[1],
            index: index + parts[0].length + 1,
            origNode: origNode
        });
        fsm.restart();
    }
}

function processWord(word, index, origNode) {
    if (isNumber(word)) {
        fsm.number({
            word: word,
            index: index,
            origNode: origNode
        });
    } else if (isUnit(word)) {
        fsm.unit({
            word: word,
            index: index,
            origNode: origNode
        });
        fsm.restart();
    } else if (hasDash(word)) {
        processDash(word, index, origNode);
    } else if (hasSlash(word)) {
        splitWordsBy(word, "([^/]+)").forEach(function(slashPart) {
            processWord(slashPart.word, index + slashPart.index, origNode);
        });
    } else {
        fsm.something({
            word: word,
            index: index,
            origNode: origNode
        });
    }
}

function fsmsearch(text, origNode) {
    state.resultSet = [];
    splitWords(text).forEach(function(wordInfo) {
        processWord(wordInfo.word, wordInfo.index, origNode);
    });
    return state.resultSet;
}

function search(data, uiState) {
    //fsm.restart();
    unitsRe = compileUnitsRe(uiState);
    var resultArray = [];
    data.forEach(function(node) {
        var text = node.text,
            searchResults = fsmsearch(text, node.index);
        Array.prototype.push.apply(resultArray, searchResults);
    });
    return resultArray;
}

module.exports = {
    isEmptyObject: isEmptyObject,
    strStartsWith: strStartsWith,
    constructUnitsRe: constructUnitsRe,
    isNumber: isNumber,
    isUnit: isUnit,
    search: search,
    splitWords: splitWords,
    singularizeUnits: singularizeUnits,
    allRegexpParts: allRegexpParts,
    regexPartsMap: regexPartsMap,
    interpretNum: interpretNum
};
