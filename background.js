chrome.tabs.onCreated.addListener(evaluateCreation)
chrome.tabs.onUpdated.addListener(function() {
    chrome.storage.sync.get("automaticEnabled", function(enabled) {
        if (enabled.automaticEnabled) {
            chrome.tabs.getSelected(null, function(tab) {
                filterResults()
                chrome.tabs.sendMessage(tab.id, "beginObservation")
            })    
        }
    })
})

chrome.runtime.onMessage.addListener(function(msg) {
    if (msg == "updateToPage") {
        updateToPage()
    }
})

function updateToPage() {
    //console.log("More videos loaded")
    filterResults()
}

function clearList() {
    //console.log("Clearing list")
    chrome.storage.sync.set({ data : [] })
    chrome.storage.sync.set({ "removedElements" : 0 })
}

function filterResults() {
    chrome.tabs.getSelected(null, function(tab) {
        if (isYouTubeSearchPage(tab.url)) {
            //console.log("Filtering results...")
            chrome.tabs.sendMessage(tab.id, "beginFilter")
        }
    })
}

function storeYouTubeLink(link) {
    var links = []
    chrome.storage.sync.get("data", function(result) { 
        if (result.data != null) { links = result.data }
        links.push(link)
        //onsole.log(links)
        chrome.storage.sync.set({ data : links }, function() { console.log("Link saved.") })    
    })
}

function isYouTubeSearchPage(url) {
    let videoLinkFormat = "https://www.youtube.com/results?search_query="
    return url.includes(videoLinkFormat)
}

function isYouTubeVideo(activeInfo) {
    //console.log(activeInfo.pendingUrl)
    //const videoLinkFormat = "https://www.youtube.com/watch?"
    const videoLinkFormat = "watch?"
    return activeInfo.pendingUrl.includes(videoLinkFormat)
}

function evaluateCreation(activeInfo) {
    //console.log("Tab created.")
    chrome.storage.sync.get("enabled", function(enabled) {
        if (isYouTubeVideo(activeInfo) && enabled.enabled) {
            //console.log("Video will be marked as watched")
            storeYouTubeLink(activeInfo.pendingUrl)
        }
    })
}