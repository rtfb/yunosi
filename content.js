var nlp = (function() {
    'use strict';

    function textNodesUnder(el) {
        var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        while (n = walk.nextNode()) {
            a.push(n);
            console.log("text node: " + n);
        }
        return a;
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.method && (request.method === "convertToSI")) {
            // (Note: You can't send back the current '#document',
            //  because it is recognised as a circular object and
            //  cannot be converted to a JSON string.)
            var html = document.body.innerHTML;
            document.body.innerHTML = replace(html, request.highlight);
            sendResponse({"text": "ok"});
        }
    });

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

    function interpretNum(what) {
        what = what.replace(",", "");
        return parseFloat(what);
    }

    function openSpan(highlight) {
        if (highlight) {
            return "<span style='background-color: yellow;'>";
        }
        return "";
    }

    function closeSpan(highlight) {
        if (highlight) {
            return "</span>";
        }
        return "";
    }

    function replace(where, highlight) {
        var matches = multisearch(where);
        matches.forEach(function(match) {
            where = where.replace(match.match,
                openSpan(highlight)
                + convertImperialToSI(match.units, match.numeral)
                + closeSpan(highlight));
        });
        return where;
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

    return {
        convertImperialToSI: convertImperialToSI,
        singularizeUnits: singularizeUnits,
        roundDecimal: roundDecimal,
        multisearch: multisearch,
        roundForReadability: roundForReadability
    };
}());
