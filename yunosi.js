(function() {
    'use strict';

    function checkboxClickListener() {
        var checkboxState = {
            method: "set-checkbox-state",
            id: this.id,
            state: this.checked
        };
        chrome.runtime.sendMessage(checkboxState, function(response) {
            if (response.success) {
                console.log("Saved successfully");
            } else {
                console.log("There was an error while saving");
            }
        });
    }

    function addCheckboxClickListeners(inputElems) {
        var i = 0,
            elem = null;
        for (i = 0; i < inputElems.length; i += 1) {
            elem = inputElems[i];
            if (elem.type === "checkbox") {
                console.log(elem.id + " - " + elem.type);
                elem.addEventListener("click", checkboxClickListener);
            }
        }
    }

    function convertUnitsToSi(uiState) {
        // Get the active tab
        chrome.tabs.query({
            active: true,
            currentWindow: true
        },
        function(tabs) {
            // If there is an active tab...
            if (tabs.length > 0) {
                // ...send a message requesting the DOM...
                chrome.tabs.sendMessage(tabs[0].id, {
                    method: "convert-to-si",
                    uiState: uiState
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        // An error occurred :(
                        console.log("ERROR: ", chrome.runtime.lastError);
                    } else {
                        // Do something useful with the HTML content
                        console.log(response.text);
                    }
                });
            }
        });
    }

    function getUiState(callback) {
        chrome.runtime.sendMessage({method: "get-ui-state"}, function(resp) {
            callback(resp);
        });
    }

    function addMainButtonListener() {
        var deimperialize = document.getElementById("deimperialize");
        deimperialize.addEventListener("click", function() {
            var highlight = document.getElementById("highlight"),
                highlightChecked = highlight.checked;
            console.log("highlightChecked = " + highlightChecked);
            getUiState(function(resp) {
                convertUnitsToSi({highlight: highlightChecked, ui: resp});
            });
        });
    }

    function addShowReadmeButtonListener() {
        var showLicense = document.getElementById("show-readme");
        showLicense.addEventListener("click", function() {
            chrome.runtime.sendMessage({method: "show-readme"}, function(resp) {
                console.log("show-readme: " + resp);
            });
        });
    }

    function restoreUiState() {
        getUiState(function(resp) {
            var key = null, elem = null;
            console.log("response: " + JSON.stringify(resp, null, 4));
            for (key in resp) {
                if (resp.hasOwnProperty(key)) {
                    elem = document.getElementById(key);
                    elem.checked = resp[key];
                }
            }
        });
    }

    window.addEventListener("DOMContentLoaded", function() {
        addMainButtonListener();
        addShowReadmeButtonListener();
        addCheckboxClickListeners(document.getElementsByTagName("input"));
        restoreUiState();
    });
}());
