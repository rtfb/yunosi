var nlp = (function() {
    'use strict';

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
        ],
            numberRe = "([\\d,]*\\.?\\d+)",
            re = new RegExp(numberRe + "[\\s-]*(" + units.join("|") + ")", "gi"),
            result,
            results = [];
        while (true) {
            result = re.exec(where);
            if (result === null) {
                break;
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

    function reduceImperialUnitNames(name) {
        if (name === "oz") {
            return "ounce";
        }
        if (name === "in") {
            return "inch";
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

    function makeReadable(value, unit) {
        var unitMap = {
            "mile": "kilometers",
            "foot": "meters",
            "fahrenheit": "Celsius",
            "yard": "meters",
            "gallon": "liters",
            "ounce": "grams",
            "pound": "kilograms",
            "inch": "centimeters"
        },
            siUnit = unitMap[unit];
        // TODO: implement unit pluralization
        return roundForReadability(value) + " " + siUnit;
    }

    function convertImperialToSI(units, value) {
        var converters = {
            "mile": function(value) {
                return value * 1.6;
            },
            "foot": function(value) {
                return value * 0.3;
            },
            "fahrenheit": function(value) {
                return Math.round((value - 32) / 1.8);
            },
            "yard": function(value) {
                return value * 0.9;
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

    function getAllTextNodes(elem) {
        var filter = NodeFilter.SHOW_TEXT,
            walker = document.createTreeWalker(elem, filter, null, false),
            arr = [],
            node;
        while (walker.nextNode()) {
            node = walker.currentNode;
            if (!node.isElementContentWhitespace) {
                arr.push(node);
            }
        }
        return arr;
    }

    function makeTextOrSpanNode(data) {
        if (!data.span) {
            return document.createTextNode(data.text);
        }
        var span = document.createElement('span');
        span.setAttribute("style", "background-color: yellow;");
        span.appendChild(document.createTextNode(data.text));
        return span;
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
                span: false
            });

            si = convertImperialToSI(match.units, match.numeral);
            textIndex = match.index + match.match.length;
            results.push({
                text: si,
                span: true
            });

            i += 1;
        }
        if (textIndex !== text.length) {
            results.push({
                text: text.substring(textIndex),
                span: false
            });
        }
        return results;
    }

    function multisearchTextNodes(nodes) {
        var resultArray = [];
        nodes.forEach(function(node) {
            var text = node.nodeValue,
                searchResults = multisearch(text);
            if (searchResults.length !== 0) {
                resultArray.push({
                    origNode: node,
                    replacement: splitBySearchResults(text, searchResults)
                });
            }
        });
        return resultArray;
    }

    function replaceTextNodes(newData) {
        newData.forEach(function(result) {
            var parentNode = result.origNode.parentNode;
            result.replacement.forEach(function(repl) {
                var newNode = makeTextOrSpanNode(repl);
                parentNode.insertBefore(newNode, result.origNode);
            });
            parentNode.removeChild(result.origNode);
        });
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.method && (request.method === "convertToSI")) {
            var textNodes = getAllTextNodes(document.body);
            replaceTextNodes(multisearchTextNodes(textNodes));
            sendResponse({"text": "ok"});
        }
    });

    return {
        convertImperialToSI: convertImperialToSI,
        singularizeUnits: singularizeUnits,
        roundDecimal: roundDecimal,
        multisearch: multisearch,
        getAllTextNodes: getAllTextNodes,
        splitBySearchResults: splitBySearchResults,
        roundForReadability: roundForReadability
    };
}());
