// https://github.com/jakesgordon/javascript-state-machine
// npm install javascript-state-machine
'use strict';

var StateMachine = require("javascript-state-machine"),
    debugLog = false,
    unitsForRegex = [
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
    ];

function log(msg) {
    if (debugLog) {
        console.log(msg);
    }
}

function fsmLog(prefix, evt, from, to, msg) {
    var details = '';
    if (msg) {
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

function interpretNum(what) {
    what = what.replace(",", "");
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

var matchGroup = {
    numeral: -1,
    units: "",
    fragments: []
};
var results = [];
var fsm = StateMachine.create({
    initial: 'AnyWord',
    events: [
{name: 'number',    from: ['AnyWord', 'NumberFound'],     to: 'NumberFound'},
{name: 'number',    from: 'HaveNumAndInfix',              to: 'AnyWord'},
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
            matchGroup.numeral = interpretNum(msg.word);
            matchGroup.fragments.push({
                origNode: msg.origNode,
                index: msg.index,
                fragType: "numeral",
                match: msg.word
            });
        },
        onunit: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            matchGroup.units = singularizeUnits(msg.word.toLowerCase());
            matchGroup.fragments.push({
                origNode: msg.origNode,
                index: msg.index,
                fragType: "unit",
                match: msg.word
            });
        },
        onAnyWord: logState,
        onNumberFound: logState,
        onleaveEnd: function(evt, from, to, msg) {
            logState(evt, from, to, msg);
            if (matchGroup.fragments.length !== 2) {
                return;
            }
            results.push(matchGroup);
            log(">> yeah, " + matchGroup.numeral + " " + matchGroup.units + ".");
        },
        onrestart: function() {
            matchGroup = {
                numeral: -1,
                units: "",
                fragments: []
            };
        }
    }
});

function stripPunctuation(word) {
    var punct = "[.,?:!]+",
        reLeft = new RegExp("^" + punct),
        reRight = new RegExp(punct + "$");
    return word.replace(reLeft, "").replace(reRight, "");
}

function splitWords(text) {
    if (!text || text === "") {
        return [];
    }
    var re = new RegExp("(\\s+)", "g"),
        index = 0,
        space,
        result = [];
    while (true) {
        space = re.exec(text);
        if (space === null) {
            break;
        }
        result.push({
            index: index,
            word: stripPunctuation(text.substring(index, space.index))
        });
        index = space.index + 1;
    }
    if (index < text.length) {
        result.push({
            index: index,
            word: stripPunctuation(text.substring(index))
        });
    }
    return result;
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
    var numberRe = /-?\+?[\d,]*\.?\d+/g;
    return isFullMatch(word, numberRe);
}

function isUnit(word) {
    log("isUnit: " + word);
    var units = unitsForRegex.join("|"),
        re = new RegExp(units, "gi");
    return isFullMatch(word, re);
}

function hasDash(word) {
    log("hasDash: " + word);
    return word.search('-') !== -1;
}

function processDash(word, index, origNode) {
    log("processDash: " + word);
    var parts = word.split("-");
    if (parts.length !== 2) {
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
        fsm.unit({
            word: parts[1],
            index: index + parts[0].length + 1,
            origNode: origNode
        });
        fsm.restart();
    }
}

function fsmsearch(text, origNode) {
    results = [];
    splitWords(text).forEach(function(wordInfo) {
        var word = wordInfo.word;
        if (isNumber(word)) {
            fsm.number({
                word: word,
                index: wordInfo.index,
                origNode: origNode
            });
        } else if (isUnit(word)) {
            fsm.unit({
                word: word,
                index: wordInfo.index,
                origNode: origNode
            });
            fsm.restart();
        } else if (hasDash(word)) {
            processDash(word, wordInfo.index, origNode);
        } else {
            fsm.something(word);
        }
    });
    return results;
}

function search(data) {
    //fsm.restart();
    var resultArray = [];
    data.forEach(function(node) {
        var text = node.text,
            searchResults = fsmsearch(text, node.index);
        Array.prototype.push.apply(resultArray, searchResults);
    });
    return resultArray;
}

module.exports = {
    search: search,
    splitWords: splitWords
};
