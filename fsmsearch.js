// https://github.com/jakesgordon/javascript-state-machine
// npm install javascript-state-machine
'use strict';

var StateMachine = require("javascript-state-machine");

function log(prefix, evt, from, to, msg) {
    var details = '';
    if (msg) {
        details = ' (' + msg + ')';
    }
    console.log(prefix + evt + ', ' + from + ' -> ' + to + details);
}

function logEvt(evt, from, to, msg) {
    log('!! ', evt, from, to, msg);
}

function logState(evt, from, to, msg) {
    log('-- ', evt, from, to, msg);
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
            console.log(">> yeah, " + value + " " + impunit + ".");
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
        console.log(word);
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

module.exports = {
    splitWords: splitWords
};
