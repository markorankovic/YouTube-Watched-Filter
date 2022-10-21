var sharedPort = {}

chrome.runtime.onConnect.addListener(function(port) {
    //console.log("Connected")
    const tabId = latestTab.id
    sharedPort[tabId] = port
})

var latestTab

function resetRemovedElementsForCurrentPage(tabId) {
    chrome.storage.sync.get("removedElements", function(result) {
        result.removedElements[tabId] = 0
        chrome.storage.sync.set({ "removedElements": result.removedElements })
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

async function filterResults(manual) {
    chrome.tabs.getSelected(null, function(tab) {
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
    })
}

async function clearList() {
    await chrome.storage.sync.clear()
    chrome.storage.sync.set({ "removedElements" : 0 })
    chrome.storage.sync.set({ "automaticEnabled" : false })
    chrome.storage.sync.set({ "reversed" : false })
}

async function storeYouTubeLink(link) {
    const videoId = trimToId(link)
    //var links = []
    //const slot = await getAvailableLinkSlot()
    //const result = await getSlot(slot)

    //console.log("slot: ", slot)

    // links = result
    // if (!links.includes(link.split("&")[0])) {
    //     links.push(link.split("&")[0])
    // }
    chrome.tabs.getSelected(null, function(currentTab) {
        setLinks(videoId).then(() => {
            //console.log("Link saved.")
            filterResults(false)
        })
    })    
}

function isYouTubeSearchPage(url) {
    let videoLinkFormat = "https://www.youtube.com/results?search_query="
    return url.includes(videoLinkFormat)
}

function isYouTubeVideo(url) {
    const videoLinkFormat = "watch?v="
    return url.includes(videoLinkFormat)
}

function evaluateCreation(tab) {
    console.log("storeYouTubeLink")
    chrome.storage.sync.get("enabled", function(enabled) {
        if (isYouTubeVideo(tab.pendingUrl) && enabled.enabled) {
            storeYouTubeLink(tab.pendingUrl)
        }
    })
}