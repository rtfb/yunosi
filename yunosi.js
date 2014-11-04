(function() {
    'use strict';
    /*
    document.getElementById("deimperialize").addEventListener("click", function deimperialize() {
        chrome.tabs.query({active: true}, function(tabs) {
            chrome.tabs.sendRequest(tabs[0].id, {method: "getText"}, function(response) {
                if (response && response.method == "getText"){
                    alert("deimperialize: " + response.data);
                }
            });
        })
    });
    */

    function checkboxClickListener() {
        var checkboxState = {
            method: "checkbox-state",
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

    window.addEventListener("DOMContentLoaded", function() {
        var deimperialize = document.getElementById("deimperialize"),
            inputs = document.getElementsByTagName("input"),
            i = 0,
            elem = null;
        deimperialize.addEventListener("click", function() {
            var highlight = document.getElementById("highlight"),
                highlightChecked = highlight.checked;
            console.log("highlightChecked = " + highlightChecked);
            // Get the active tab
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                // If there is an active tab...
                if (tabs.length > 0) {
                    // ...send a message requesting the DOM...
                    chrome.tabs.sendMessage(tabs[0].id, {
                        method: "convert-to-si",
                        highlight: highlightChecked
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
        });

        for (i = 0; i < inputs.length; i += 1) {
            elem = inputs[i];
            if (elem.type === "checkbox") {
                console.log(elem.id + " - " + elem.type);
                elem.addEventListener("click", checkboxClickListener);
            }
        }

        chrome.runtime.sendMessage({method: "get-ui-state"}, function(response) {
            var key;
            console.log("response: " + JSON.stringify(response, null, 4));
            for (key in response) {
                if (response.hasOwnProperty(key)) {
                    elem = document.getElementById(key);
                    elem.checked = response[key];
                }
            }
        });
    });
}());
