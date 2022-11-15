console.log('background.js executing')

class VideoStore {
    videos = new Set()

    constructor() {
        setTimeout(() => {
            console.log('Timeout done')
            this.load()
        }, 10000)
    }

    filter(videosLoaded) {
        // console.log('Videos received for filter: ', videosLoaded)
        return videosLoaded.filter(video => this.videos.has(video))
    }

    async load() {
        chrome.storage.sync.get('watchedVids')
            .then(res => {
                if (res?.watchedVids?.length) {
                    this.videos = new Set(res.watchedVids)
                    // Call for filter on current tab
                }
            })
    }

    async storeInSync() {
        // console.log('Videos to store: ', this.videos)
        chrome.storage.sync.set({'watchedVids' : Array.from(this.videos)})
            .then(() => { 
                // console.log('Stored videos')
                chrome.storage.sync.get('watchedVids')
                    // .then(videos => console.log('Videos stored: ', videos)) 
            })
    }

    store(videoId) {
        console.log('Storing video ' + videoId)
        this.videos.add(videoId)
        this.storeInSync()
    }
}

const videos = new VideoStore()

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.videoId) {
            sendResponse('Video ' + request.videoId + ' has been received')
            videos.store(request.videoId)
        } else if (request.message == 'filterVideos') {
            const videosToSend = videos.filter(request.videosLoaded)
            // console.log('Videos to send:', videosToSend)
            sendResponse({videos: videosToSend})
        }
    }
)

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.url) {
            console.log('URL changed at tab: ', tabId)
            chrome.tabs.sendMessage(tabId, { message : 'urlChanged' }).catch(err => console.log('Error messaging tab: ', err))
        }
    }
)

// var sharedPort = {}

// chrome.runtime.onConnect.addListener(function(port) {
//     const tabId = latestTab.id
//     sharedPort[tabId] = port
// })

// var latestTab

// function resetRemovedElementsForCurrentPage(tabId) {
//     chrome.storage.sync.get("removedElements", function(result) {
//         if (!result.removedElements) return
//         result.removedElements[tabId] = 0
//         chrome.storage.sync.set({ "removedElements": result.removedElements })
//     })
// }

// chrome.tabs.onCreated.addListener(function(tab) {
//     latestTab = tab
//     evaluateCreation(tab)
// })

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     latestTab = tab
//     if (changeInfo.status == "complete") {
//         resetRemovedElementsForCurrentPage(tabId)
//     }
//     if (changeInfo.status == "complete" && sharedPort[tabId] && isYouTubeSearchPage(tab.url)) {
//         sharedPort[tabId].postMessage({func: "beginObservation", tabId: tabId})
//         filterResults(false)
//     } else if (isYouTubeVideo(tab.url)) {
//         chrome.storage.sync.get("enabled", function(enabled) {
//             if (enabled.enabled) {
//                 storeYouTubeLink(tab.url)
//             }
//         })
//     }
// })

// async function getCurrentTab() {
//     let queryOptions = { active: true, lastFocusedWindow: true };
//     let [tab] = await chrome.tabs.query(queryOptions);
//     return tab;
// }  

// async function filterResults(manual) {
//     const tab = await getCurrentTab()
//     sharedPort[tab.id].postMessage({func: "beginFilter", tabId: tab.id, manual: manual})
// }

// async function clearList() {
//     await chrome.storage.sync.clear()
//     chrome.storage.sync.set({ "removedElements" : 0 })
//     chrome.storage.sync.set({ "automaticEnabled" : false })
//     chrome.storage.sync.set({ "reversed" : false })
// }

// async function storeYouTubeLink(link) {
//     setLinks(link).then(() => {
//         filterResults(false)
//     })
// }

// function isYouTubeSearchPage(url) {
//     let videoLinkFormat = "https://www.youtube.com/results?search_query="
//     return url.includes(videoLinkFormat)
// }

// function isYouTubeVideo(url) {
//     const videoLinkFormat = "watch?v="
//     return url.includes(videoLinkFormat)
// }

// function evaluateCreation(tab) {
//     chrome.storage.sync.get("enabled", function(enabled) {
//         if (isYouTubeVideo(tab.pendingUrl) && enabled.enabled) {
//             storeYouTubeLink(tab.pendingUrl)
//         }
//     })
// }