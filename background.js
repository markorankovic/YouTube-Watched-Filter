var sharedPort = {}

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected")
    const tabId = latestTab.id
    sharedPort[tabId] = port
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
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
    })
}

async function setLinks(links) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ "data" : links }, function() {
            resolve()
        })
    })
}

function clearLinks() {
    setLinks([])
}

async function getLinks() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("data", (result) => {
            const links = result?.data ?? []
            console.log("links: ", links)
            resolve(links)
        })    
    })
}

function clearList() {
    clearLinks()
    chrome.storage.sync.set({ "removedElements" : 0 })
    chrome.storage.sync.set({ "automaticEnabled" : false })
}

async function storeYouTubeLink(link) {
    var links = []
    
    const result = await getLinks()

    console.log("result: ", result)

    links = result
    if (!links.includes(link.split("&")[0])) {
        links.push(link.split("&")[0])
    }
    chrome.tabs.getSelected(null, function(currentTab) {
        setLinks(links).then(() => {
            console.log("Link saved.")
            console.log(currentTab.id)
            console.log(sharedPort)
            filterResults(false)
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