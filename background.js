var sharedPort = {}

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected")
    const tabId = latestTab.id
    sharedPort[tabId] = port
    port.onDisconnect.addListener(function() {
        // console.log(port)
        // console.log("Disconnected port")
    })
})

var latestTab

function resetRemovedElementsForCurrentPage(tabId) {
    chrome.storage.sync.get("removedElements", function(result) {
        result.removedElements[tabId] = 0
        chrome.storage.sync.set({ "removedElements": result.removedElements })
        console.log(result.removedElements[tabId])
    })
}

chrome.tabs.onCreated.addListener(function(tab) {
    latestTab = tab
    evaluateCreation(tab)
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    latestTab = tab
    if (changeInfo.status == "complete") {
        resetRemovedElementsForCurrentPage(tabId)
    }
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
        console.log("sharedPort: ", sharedPort)
        console.log("tab.id: ", tab.id)
        console.log("sharedPort[tab.id]: ", sharedPort[tab.id])
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
    })
}

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

async function getAvailableDataKey() {
    const keys = getDataKeys()
    const nKeys = getNDataKeys()
    var i = 0
    for (i = 0; i < nKeys.length; i++) {
        await chrome.storage.sync.getBytesInUse(keys[i + 1], function(currentStorage) {
            const maxStorage = chrome.storage.sync.QUOTA_BYTES_PER_ITEM
            const bytesPerVideo = maxStorage / 178
            const nSpaceForVideos = (maxStorage - currentStorage) / bytesPerVideo
            if (nSpaceForVideos >= 1) {
                return Promise.resolve("data" + (i + 1))
            }
        })
    }
    return Promise.resolve("data1")
}

function clearList() {
    chrome.storage.sync.clear()
    chrome.storage.sync.set({ "removedElements" : 0 })
    chrome.storage.sync.set({ "automaticEnabled" : false })
}

async function storeYouTubeLink(link) {
    var links = []
    const key = await getAvailableDataKey()
    console.log("key: ", key)
    chrome.storage.sync.get(key, function(result) { 
        if (result.data != null) { links = result.data }
        // console.log(links)
        if (!links.includes(link.split("&")[0])) {
            links.push(link.split("&")[0])
        }
        // console.log(links)
        chrome.tabs.getSelected(null, function(currentTab) {
            chrome.storage.sync.set({ key : links }, function() { console.log("Link saved."); console.log(currentTab.id); console.log(sharedPort); filterResults(false) })
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