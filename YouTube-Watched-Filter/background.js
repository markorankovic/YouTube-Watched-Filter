console.log('background.js executing')

chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

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

    removeTab(tabId) {
        this.filtered.delete(tabId)
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
                this.getById(loadedVideo).filtered.add(tabId)
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
        const exists = this.exists(videoId)
        if (exists) return
        console.log('Adding video: ', videoId)
        this.videos.add(new Video(videoId, null))
    }

    add(video) {
        this.addNew(video.id)
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

async function resetSync() {
    await chrome.storage.sync.clear()
    await videos.reset()
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('request: ', request)
        if (request.videoId && !request.message) {
            sendResponse('Video ' + request.videoId + ' has been received')
            videos.store(request.videoId)
        } else if (request.message == 'filterVideos') {
            const videosToSend = videos.filter(request.videosLoaded, sender.tab.id)
            sendResponse({videos: videosToSend})
        } else if (request.message.func == 'getFilteredVideosCount') {
            sendResponse({videosFiltered: videos.filteredByTab(request.message.tab.id).length})
        } else if (request.message.func == 'getTotalVideosCount') {
            sendResponse({totalVideos: videos.videos.size})
        } else if (request.message === 'exists') {
            const exists = videos.exists(request.videoId)
            sendResponse({exists: exists})
        } else if (request.message == 'resetLocal') {
            resetLocal()
        } else if (request.message == 'resetSync') {
            resetSync()
        }
    }
)

chrome.tabs.onUpdated.addListener(
    async function(tabId, changeInfo, tab) {
        await videos.filteredByTab(tabId).forEach(video => video.removeTab(tabId))
        if (changeInfo.url) {
            console.log('URL changed at tab: ', tabId)
            chrome.tabs.sendMessage(tabId, { message : 'urlChanged' }).catch(err => console.log('Error messaging tab: ', err))
        }
    }
)

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({'enabled': true})
})

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