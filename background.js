chrome.tabs.onCreated.addListener(evaluateCreation)

function clearList() {
    console.log("Clearing list")
    chrome.storage.sync.set({ data : [] })    
}

function filterResults() {
    chrome.tabs.getSelected(null, function(tab) {
        if (isYouTubeSearchPage(null, null, tab)) {
            console.log("Filtering results...")
            chrome.storage.sync.get("data", function(result) {
                const links = result.data
                chrome.storage.sync.set({ toFilter : links }, function() { 
                    console.log("Links to filter set.")
                    chrome.tabs.executeScript(null, {file: './foreground.js'}, () => console.log("Execute foreground"))
                })
            })        
        }
    })
}

function storeYouTubeLink(link) {
    var links = []
    chrome.storage.sync.get("data", function(result) { 
        if (result.data != null) { links = result.data }
        links.push(link)
        console.log(links)
        chrome.storage.sync.set({ data : links }, function() { console.log("Link saved.") })    
    })
}

function isYouTubeSearchPage(tabId, changeInfo, tab) {
    if (tab.status != 'complete') { return false }
    let videoLinkFormat = "https://www.youtube.com/results?search_query="
    return tab.url.includes(videoLinkFormat)
}

function isYouTubeVideo(activeInfo) {
    console.log(activeInfo.pendingUrl)
    let videoLinkFormat = "https://www.youtube.com/watch?"
    return activeInfo.pendingUrl.includes(videoLinkFormat)
}

function evaluateCreation(activeInfo) {
    console.log("Tab created.")
    chrome.storage.sync.get("enabled", function(enabled) {
        if (isYouTubeVideo(activeInfo) && enabled.enabled) {
            console.log("Video will be marked as watched")
            storeYouTubeLink(activeInfo.pendingUrl)
        }
    })
}