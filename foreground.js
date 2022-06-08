var sharedPort = chrome.runtime.connect()

sharedPort.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log("Message received")
    if (msg.func == "beginObservation") {
        beginObservation(msg.tabId)
    } else if (msg.func == "beginFilter") {
        console.log("beginFilter")
        beginFilter(msg.tabId, msg.manual)
    }
})

sharedPort.onDisconnect.addListener(function() {
    // console.log("Disconnected")
})

console.log("Foreground executing")

function getNDataKeys() {
    return chrome.storage.sync.MAX_ITEMS - 2
}

function getDataKeys() {
    const nKeys = getNDataKeys()
    var keys = []
    for (var i = 0; i < nKeys; i++) {
        keys.push("data" + (i + 1))
    }
    return keys
}

function beginFilter(tabId, manual) {
    chrome.storage.sync.get("automaticEnabled", function(autoenabled) {
        if (autoenabled.automaticEnabled || manual) {
            chrome.storage.sync.get("data1", function(result) {
                console.log("result: ", result)
                const links = result.data
                console.log("links: ", links)
                filter(links, tabId)
            })            
        }
    })
}

function beginObservation(tabId) {
    // console.log("beginObservation")
    const observer = new MutationObserver(function(mutationList) {
        beginFilter(tabId, false)
    })
    const e = document.getElementById("contents")
    if (e != null) {
        observer.observe(e, { childList : true, subtree : true })            
    }
}

var removedElements = 0

function filter(links, tabId) {
    var i;
    for (i = 0; i < (links ? links.length : 0); i++) {
        if (links[i] != null) {
            evaluate(links[i])
        }
    }
    setRemovedElements(tabId)
}

function setRemovedElements(tabId) {
    //console.log(removedElements)
    chrome.storage.sync.get("removedElements", function(result) {
        if (result.removedElements) {
            //console.log(removedElements)
            result.removedElements[tabId] = removedElements
        } else {
            result.removedElements = []
            result.removedElements[tabId] = removedElements
        }
        chrome.storage.sync.set({ "removedElements": result.removedElements })
    })
}

function evaluate(link) {
    const videoElements = document.getElementsByTagName("ytd-video-renderer")
    var i;
    for (i = 0; i < videoElements.length; i++) {
        const e = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")
        var linkElement = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")[0]
        if (linkElement) {
            const href = linkElement.getAttribute('href').split("&")[0]
            if (link.includes(href)) {
                console.log(href)
                videoElements[i].remove()
                removedElements++
            }    
        }
    }
}