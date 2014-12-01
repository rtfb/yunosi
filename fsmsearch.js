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

var value = null;
var impunit = null;
var separator = " ";
var matchStartIndex = -1;
var results = [];
var fsm = StateMachine.create({
    initial: 'AnyWord',
    events: [
        {name: 'number',    from: ['AnyWord', 'NumberFound', 'Tmesis'], to: 'NumberFound'},
        {name: 'something', from: ['AnyWord', 'NumberFound', 'Tmesis'], to: 'Tmesis'},
        {name: 'unit',      from: 'Tmesis',                             to: 'End'},
        {name: 'unit',      from: 'NumberFound',                        to: 'End'},
        {name: 'restart',   from: 'End',                                to: 'AnyWord'}
    ],
    callbacks: {
        onnumber: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            value = msg.word;
            matchStartIndex = msg.index;
        },
        onunit: function(evt, from, to, msg) {
            logEvt(evt, from, to, msg);
            impunit = msg;
        },
        onAnyWord: logState,
        onNumberFound: logState,
        onTmesis: logState,
        onleaveEnd: function(evt, from, to, msg) {
            logState(evt, from, to, msg);
            if (!value || !impunit) {
                return;
            }
            results.push({
                index: matchStartIndex,
                match: value + separator + impunit,
                units: singularizeUnits(impunit.toLowerCase()),
                numeral: interpretNum(value)
            });
            log(">> yeah, " + value + " " + impunit + ".");
        },
        onrestart: function() {
            value = null;
            impunit = null;
            separator = " ";
            matchStartIndex = -1;
        }
    }
});

function doFoo() {
    var words = ['foo', 'bar', '1', 'baz', '2', 'miles', 'goo'];

    words.forEach(function(word) {
        if (word === '1' || word === '2') {
            fsm.number(word);
        } else if (word === 'miles') {
            fsm.unit(word);
            fsm.restart();
        } else {
            fsm.something(word);
        }
        log(word);
    });
}

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

function processDash(word, index) {
    log("processDash: " + word);
    var parts = word.split("-");
    if (parts.length !== 2) {
        return;
    }
    if (isNumber(parts[0])) {
        fsm.number({word: parts[0], index: index});
    }
    if (isUnit(parts[1])) {
        separator = "-";
        fsm.unit(parts[1]);
        fsm.restart();
    }
}

function fsmsearch(text) {
    results = [];
    splitWords(text).forEach(function(wordInfo) {
        var word = wordInfo.word;
        if (isNumber(word)) {
            fsm.number({word: word, index: wordInfo.index});
        } else if (isUnit(word)) {
            fsm.unit(word);
            fsm.restart();
        } else if (hasDash(word)) {
            processDash(word, wordInfo.index);
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
            searchResults = fsmsearch(text);
        if (searchResults.length !== 0) {
            resultArray.push({
                origNode: node.index,
                results: searchResults
            });
        }
    });
    return resultArray;
}

module.exports = {
    search: search,
    splitWords: splitWords
};
