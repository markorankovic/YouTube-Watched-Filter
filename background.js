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

async function filterResults(manual) {
    const links = await getLinks()
    console.log("filterResults links: ", links)
    chrome.tabs.getSelected(null, function(tab) {
        sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual, links: links})
    })
}

async function check(key) {
    // 178 links is the maximum amount that can be stored in a single item
    const maxLinksPerSlot = 177

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, function(result) {
            const slot = result
            console.log("check slot: ", slot)
            if (typeof slot === "undefined") {
                console.log("Resolving to true")
                resolve(true)
            }
            console.log("slot[key]: ", slot[key])
            if (!slot[key]) {
                console.log("Resolving to true")
                resolve(true)
            }
            console.log("maxLinksPerSlot: ", maxLinksPerSlot)
            if (slot[key].length < maxLinksPerSlot) {
                console.log("Resolving to true")
                resolve(true)
            }
            console.log("Resolving to false")
            resolve(false)
        })
    })
}

async function getAvailableLinkSlot() {
    // Other than removedElements, automaticEnabled and enabled there should be full space for links within each item 
    const maxSlots = chrome.storage.sync.MAX_ITEMS - 3
    return new Promise(async (resolve, reject) => {
        for (var i = 1; i <= maxSlots; i++) {
            const key = "data" + i
            const availableSlot = await check(key)
            console.log("availableSlot: ", availableSlot)
            if (availableSlot) {
                console.log(key)
                return resolve(key)
            }
        }
        reject("No available slots")
    })
}

async function getSlot(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, function(result) {
            console.log("getSlot result: ", result)
            if (result[key]?.length) {
                return resolve(result[key])
            }
            return resolve([])
        })    
    })
}

async function getLinksFromAllSlots() {
    // Other than removedElements, automaticEnabled and enabled there should be full space for links within each item 
    const maxSlots = chrome.storage.sync.MAX_ITEMS - 3
    return new Promise(async (resolve, reject) => {
        var links = []
        for (var i = 1; i < (maxSlots + 1); i++) {
            const key = "data" + i
            console.log("key: ", key)
            const slot = await getSlot(key)
            if (slot.length === 0) {
                break
            }   
            links.push(...slot)
        }
        console.log("Total links length: ", links.length)
        resolve(links)
    })
}

async function setLinks(links) {
    const slot = await getAvailableLinkSlot()
    console.log("slot: ", slot)
    return new Promise((resolve, reject) => {
        console.log("Links: ", links)
        var pair = {}
        pair[slot] = links
        chrome.storage.sync.set(pair, function() {
            console.log("Links set at: ", slot)
            resolve()
        })
    })
}

async function getLinks() {
    return getLinksFromAllSlots()
}

async function clearList() {
    await chrome.storage.sync.clear()
    chrome.storage.sync.set({ "removedElements" : 0 })
    chrome.storage.sync.set({ "automaticEnabled" : false })
}

async function storeYouTubeLink(link) { // TODO: The last 176 links + the new link
    var links = []
    
    const slot = await getAvailableLinkSlot()
    const result = await getSlot(slot)

    console.log("result: ", result)

    links = result
    if (!links.includes(link.split("&")[0])) {
        links.push(link.split("&")[0])
    }
    chrome.tabs.getSelected(null, function(currentTab) {
        setLinks(links).then(() => {
            console.log("Link saved.")
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