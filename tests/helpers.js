
function fillDefaults(dict, defaultValue) {
    if (!dict) {
        return dict;
    }
    Object.keys(nlp.regexPartsMap).forEach(function(key) {
        if (!dict.hasOwnProperty(key)) {
            dict[key] = defaultValue;
        }
    });
    return dict;
}

function strArrToObjArr(arr) {
    return arr.map(function(item) {
        return {nodeValue: item};
    });
}

function strArrToIndexedNodesArr(arr) {
    return content.nodesToIndexedArray(strArrToObjArr(arr));
}
