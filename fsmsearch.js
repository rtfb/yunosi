// https://github.com/jakesgordon/javascript-state-machine
// npm install javascript-state-machine
'use strict';

var StateMachine = require("javascript-state-machine"),
    debugLog = false;

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

var value = null;
var impunit = null;
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
            value = msg;
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
            log(">> yeah, " + value + " " + impunit + ".");
        },
        onrestart: function() {
            value = null;
            impunit = null;
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

function isNumber(word) {
    log("isNumber: " + word);
    var numberRe = /-?\+?[\d,]*\.?\d+/g;
    return word.search(numberRe) !== -1;
}

function isUnit(word) {
    log("isUnit: " + word);
    if (word === 'miles') {
        return true;
    }
    return false;
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

function fsmsearch(text) {
    var results = [];
    splitWords(text).forEach(function(wordInfo) {
        var word = wordInfo.word;
        if (isNumber(word)) {
            fsm.number(word);
        } else if (isUnit(word)) {
            fsm.unit(word);
            fsm.restart();
        } else {
            fsm.something(word);
        }
        fsm.onleaveEnd = function(evt, from, to, msg) {
            logState(evt, from, to, msg);
            if (!value || !impunit) {
                return;
            }
            results.push({
                index: wordInfo.index,
                match: value + " " + impunit,
                units: singularizeUnits(impunit),
                numeral: interpretNum(value)
            });
            log(">> yeah, " + value + " " + impunit + ".");
        };
    });
    /*
        results.push({
            index: result.index,
            match: result[0],
            units: singularizeUnits(result[2].toLowerCase()),
            numeral: interpretNum(result[1])
        });
        */
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
