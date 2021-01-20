var sharedPort = {}

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected")
    chrome.tabs.getSelected(null, function(tab) {
        const tabId = tab.id
        sharedPort[tabId] = port
        port.onDisconnect.addListener(function() {
            console.log(port)
            console.log("Disconnected port: " + port.id)
        })        
    })
})

chrome.tabs.onCreated.addListener(function(tab) {
    evaluateCreation(tab)
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == "complete" && sharedPort[tabId] && isYouTubeSearchPage(tab.url)) {
        sharedPort[tabId].postMessage({func: "beginObservation", tabId: tabId})
        filterResults(false)
    }
    
})

function filterResults(manual) {
    chrome.tabs.getSelected(null, function(tab) {
        console.log(sharedPort)
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
    })
}

function clearList() {
    chrome.storage.sync.set({ data : [] })
    chrome.storage.sync.set({ "removedElements" : 0 })
}

function storeYouTubeLink(link) {
    var links = []
    chrome.storage.sync.get("data", function(result) { 
        if (result.data != null) { links = result.data }
        links.push(link)
        chrome.tabs.getSelected(null, function(currentTab) {
            chrome.storage.sync.set({ data : links }, function() { console.log("Link saved."); console.log(currentTab.id); console.log(sharedPort); filterResults(false) })
        })
    })
}

function isYouTubeSearchPage(url) {
    let videoLinkFormat = "https://www.youtube.com/results?search_query="
    return url.includes(videoLinkFormat)
}

function isYouTubeVideo(tab) {
    const videoLinkFormat = "watch?"
    return tab.pendingUrl.includes(videoLinkFormat)
}

function evaluateCreation(tab) {
    chrome.storage.sync.get("enabled", function(enabled) {
        if (isYouTubeVideo(tab) && enabled.enabled) {
            storeYouTubeLink(tab.pendingUrl)
        }
    })
}