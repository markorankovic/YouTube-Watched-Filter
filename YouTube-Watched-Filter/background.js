console.log('background.js executing')

class Video {
    id = null // The video ID
    filtered = new Set() // The set of tabs the video is filtered under

    constructor(id, tabId) {
        this.id = id
        if (tabId) addTab(tabId)
    }

    hasTab(tabId) {
        return this.filtered.has(tabId)
    }

    addTab(tabId) {
        this.filtered.add(tabId)
    }
}

class VideoStore {
    videos = new Set()

    constructor() {
        this.load()
    }

    filteredByTab(tabId) {
        return [...this.videos].filter(video => video.hasTab(tabId))
    }

    videoToFilterMatchesVideoId(video) {
        return video.id == videoToFilter
    }

    exists(video) {
        return [...this.videos].map(v => v.id).includes(video)
    }

    getById(id) {
        return [...this.videos].find(video => video.id == id)
    }

    filter(videosLoaded, tabId) {
        var videosToRemove = []
        for (const loadedVideo of videosLoaded) {
            if (this.exists(loadedVideo)) {
                videosToRemove.push(loadedVideo)
                this.getById(loadedVideo).tab = tabId
            }
        }
        return videosToRemove
    }

    process(videos) {
        console.log('videos: ', videos)
        if (videos?.length) {
            console.log('videos length: ', videos.length)
            for (const video of videos) { console.log('video: ', video); this.add(video) }
            console.log(this.videos)
            getCurrentTab()
                .then(tab => {
                    chrome.tabs.sendMessage(tab.id, {message: 'filterPage'})
                })
        }
    }

    async load() {
        const watchedVids = (await chrome.storage.sync.get('watchedVids')).watchedVids
        const archivedVideoLinks = (await chrome.storage.local.get('archivedVideoLinks')).archivedVideoLinks
        this.process(watchedVids)
        this.process(archivedVideoLinks)
    }

    async reset() {
        console.log('Resetting videos')
        await this.videos.clear()
        await this.load()
    }

    async storeLocally() {
        chrome.storage.local.set({ 'archivedVideoLinks' : [...this.videos] })
            .catch(err => { console.log("Error storing video: ", err) })
    }

    async storeInSync() {
        // console.log('Videos to store: ', this.videos)
        chrome.storage.sync.set({ 'watchedVids' : [...this.videos] })
            .then(() => { 
                // console.log('Stored videos')
                chrome.storage.sync.get('watchedVids')
                    // .then(videos => console.log('Videos stored: ', videos)) 
            })
            .catch(err => { console.log("Error storing video: ", err) })
    }

    addNew(videoId) {
        const exists = [...this.videos].filter(video => video.id == videoId).length > 0
        if (exists) return
        this.videos.add(new Video(videoId, null))
    }

    add(video) {
        const exists = this.exists(video.id)
        if (exists) { return }
        console.log('Adding video: ', video)
        this.videos.add(new Video(video.id, null))
    }

    store(videoId) {
        // console.log('Storing video ' + videoId)
        this.addNew(videoId)
        this.storeInSync().catch(_ => this.storeLocally())
    }
}

const videos = new VideoStore()

async function resetLocal() {
    await chrome.storage.local.clear()
    await videos.reset()
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.videoId) {
            sendResponse('Video ' + request.videoId + ' has been received')
            videos.store(request.videoId)
        } else if (request.message == 'filterVideos') {
            const videosToSend = videos.filter(request.videosLoaded, sender.tab.id)
            // console.log('Videos to send:', videosToSend)
            sendResponse({videos: videosToSend})
        } else if (request.message.func == 'getFilteredVideosCount') {
            sendResponse({videosFiltered: videos.filteredByTab(request.message.tab.id).length})
        } else if (request.message == 'resetLocal') {
            resetLocal()
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

chrome.storage.onChanged.addListener((changes, _) => {
  console.log('Changes detected on storage: ', changes)
  if (changes.archivedVideoLinks) {
    console.log('New archive file uploaded!')
    loadArchivedVideos(changes.archivedVideoLinks.newValue)
  }
})

async function loadArchivedVideos(archivedVideos) {
    console.log('Archived videos: ', archivedVideos)
    await chrome.storage.local.set({'archivedVideoLinks' : archivedVideos})
    for (const video of archivedVideos) {
        videos.add(video)
    }
}

async function getCurrentTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            resolve(tabs[0])
        });    
    })
}

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