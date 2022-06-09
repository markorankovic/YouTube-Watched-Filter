var sharedPort = chrome.runtime.connect()

sharedPort.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.func == "beginObservation") {
        beginObservation(msg.tabId)
    } else if (msg.func == "beginFilter") {
        beginFilter(msg.tabId, msg.manual, msg.links)
    }
})

console.log("Foreground executing")

function beginFilter(tabId, manual, links) {
    console.log("beginFilter")
    chrome.storage.sync.get("automaticEnabled", function(autoenabled) {
        if (autoenabled.automaticEnabled || manual) {
            console.log("beginFilter links", links)
            filter(links, tabId)
        }
    })
}

function beginObservation(tabId) {
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
    console.log("filter links: ", links)
    var i;
    for (i = 0; i < (links ? links.length : 0); i++) {
        if (links[i] != null) {
            evaluate(links[i])
        }
    }
    setRemovedElements(tabId)
}

function setRemovedElements(tabId) {
    chrome.storage.sync.get("removedElements", function(result) {
        if (result.removedElements) {
            result.removedElements[tabId] = removedElements
        } else {
            result.removedElements = []
            result.removedElements[tabId] = removedElements
        }
        chrome.storage.sync.set({ "removedElements": result.removedElements })
    })
}

function evaluate(link) {
    console.log("evaluate link: ", link)
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