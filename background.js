var sharedPort = {}

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected")
    const tabId = latestTab.id
    sharedPort[tabId] = port
    port.onDisconnect.addListener(function() {
        console.log(port)
        console.log("Disconnected port")
    })        
})

var latestTab

chrome.tabs.onCreated.addListener(function(tab) {
    latestTab = tab
    evaluateCreation(tab)
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    latestTab = tab
    if (changeInfo.status == "complete" && sharedPort[tabId] && isYouTubeSearchPage(tab.url)) {
        sharedPort[tabId].postMessage({func: "beginObservation", tabId: tabId})
        filterResults(false)
    } else if (isYouTubeVideo(tab.url)) {
        chrome.storage.sync.get("enabled", function(enabled) {
            if (enabled.enabled) {
                storeYouTubeLink(tab.url)
            }
        })
    }
})

function filterResults(manual) {
    chrome.tabs.getSelected(null, function(tab) {
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
    })
}

function clearList() {
    chrome.storage.sync.set({ data : [] })
    chrome.storage.sync.set({ "removedElements" : 0 })
    chrome.storage.sync.set({ "automaticEnabled" : false })
}

function storeYouTubeLink(link) {
    var links = []
    chrome.storage.sync.get("data", function(result) { 
        if (result.data != null) { links = result.data }
        console.log(links)
        if (!links.includes(link.split("&")[0])) {
            links.push(link.split("&")[0])
        }
        console.log(links)
        chrome.tabs.getSelected(null, function(currentTab) {
            chrome.storage.sync.set({ data : links }, function() { console.log("Link saved."); console.log(currentTab.id); console.log(sharedPort); filterResults(false) })
        })
    })
}

function isYouTubeSearchPage(url) {
    let videoLinkFormat = "https://www.youtube.com/results?search_query="
    return url.includes(videoLinkFormat)
}

function isYouTubeVideo(url) {
    const videoLinkFormat = "watch?"
    return url.includes(videoLinkFormat)
}

function evaluateCreation(tab) {
    chrome.storage.sync.get("enabled", function(enabled) {
        if (isYouTubeVideo(tab.pendingUrl) && enabled.enabled) {
            storeYouTubeLink(tab.pendingUrl)
        }
    })
}