async function check(key) {
    // 177 links is the maximum amount that can be stored in a single item
    const maxLinksPerSlot = 177

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, function(result) {
            const slot = result
            if (typeof slot === "undefined") {
                resolve(true)
            }
            if (!slot[key]) {
                resolve(true)
            }
            if (!slot[key].length) {
                resolve(true)
            }
            if (slot[key].length < maxLinksPerSlot) {
                resolve(true)
            }
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
            if (availableSlot) {
                return resolve(key)
            }
        }
        reject("No available slots")
    })
}

async function getSlot(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, function(result) {
            if (result[key]?.length) {
                return resolve(result[key])
            }
            return resolve([])
        })    
    })
}

async function getLinksFromAllSlots() {
    const maxSlots = chrome.storage.sync.MAX_ITEMS - 3
    return new Promise(async (resolve, reject) => {
        var links = []
        for (var i = 1; i < (maxSlots + 1); i++) {
            const key = "data" + i
            const slot = await getSlot(key)
            if (slot.length === 0) {
                break
            }   
            links.push(...slot)
        }
        resolve(links)
    })
}

async function setLinks(links) {
    const slot = await getAvailableLinkSlot()
    console.log("slot: ", slot)
    return new Promise((resolve, reject) => {
        var pair = {}
        pair[slot] = links
        chrome.storage.sync.set(pair, function() {
            resolve()
        })
    })
}

async function getLinks() {
    return getLinksFromAllSlots()
}