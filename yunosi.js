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

function mkSendMessageToActiveTab(msg) {
    return function() {
        // Get the active tab
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            // If there is an active tab...
            if (tabs.length > 0) {
                // ...send a message requesting the DOM...
                chrome.tabs.sendMessage(tabs[0].id, {
                    method: msg
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
    };
}

window.addEventListener("DOMContentLoaded", function() {
    var highlight = document.getElementById("highlight");
    highlight.addEventListener("click", mkSendMessageToActiveTab("highlightImperial"));

    var deimperialize = document.getElementById("deimperialize");
    deimperialize.addEventListener("click", mkSendMessageToActiveTab("convertToSI"));

    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; ++i) {
        var elem = inputs[i];
        if (elem.type === "checkbox") {
            console.log(elem.id + " - " + elem.type);
            elem.addEventListener("click", function() {
                var checkboxState = {
                    action: "checkbox-state",
                    id: this.id,
                    state: this.checked
                }
                chrome.runtime.sendMessage(checkboxState, function(response) {
                    if (response.success) {
                        console.log("Saved successfully");
                    } else {
                        console.log("There was an error while saving");
                    }
                });
            });
        }
    }

    chrome.runtime.sendMessage({action: "get-ui-state"}, function(response) {
        console.log("response: " + JSON.stringify(response, null, 4));
        for (key in response) {
            var elem = document.getElementById(key);
            elem.checked = response[key];
        }
    });
});
