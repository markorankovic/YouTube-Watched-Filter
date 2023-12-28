console.log('foreground.js executing')

function passWatchedVideo(videoId) {
    console.log('Passing watched video:', videoId)
    chrome.runtime.sendMessage({videoId : videoId}, (res) => console.log(res))
}

function videoElementWithID(videoId, videosLoaded) {
    for (const videoLoaded of videosLoaded) {
        if (videoElementToVideoId(videoLoaded) == videoId) {
            return videoLoaded
        }
    }
    return null
}

async function getVideosWithMatchingIds(videosLoaded, videosToFilter) {
    // console.log('Videos to filter: ', videosToFilter)
    var videosToRemove = []
    for (const videoToFilter of videosToFilter) {
        const videoElement = videoElementWithID(videoToFilter, videosLoaded)
        const videoExists = !!videoElement
        if (videoExists) videosToRemove.push(videoElement)
    }
    return videosToRemove
}

async function getExistingVideos(videosLoaded) {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage(
            {message : 'filterVideos', videosLoaded : videosLoaded.map(video => videoElementToVideoId(video))},
            (res) => {
                // console.log('Received videos:', res.videos)
                resolve(res.videos) 
            })
    })
}

async function videoExists(videoId) {
    return new Promise(function(resolve, _) {
        chrome.runtime.sendMessage(
            {message : 'exists', videoId : videoId},
            (res) => {
                resolve(res.exists)
            }
        )
    })
}

async function removeVideosExistingInFilter(videosLoaded) {
    const videosToFilter = await getExistingVideos(videosLoaded)
    const matchingVideos = await getVideosWithMatchingIds(videosLoaded, videosToFilter)
    removeVideos(matchingVideos)
}

async function removeVideosOutsideFilter(videosLoaded) {
    const videosToRemove = []
    for (const videoLoaded of videosLoaded) {
        const exists = await videoExists(videoElementToVideoId(videoLoaded))
        const unfinishedVideo = videoElementHasProgressBar(videoLoaded)
        if (!exists && !unfinishedVideo) videosToRemove.push(videoLoaded)
    }
    removeVideos(videosToRemove)
}

function removeVideos(videos) {
    if (videos.length === 0) return
    for (const videoElement of videos) {
        videoElement.remove()
        console.log('Video ' + videoElementToVideoId(videoElement) + ' has been removed')
    }
}

function videoElementHasProgressBar(video) {
    return video.getElementsByTagName('ytd-thumbnail-overlay-resume-playback-renderer').length > 0
}

function filterUnfinishedVideos(videos) {
    removeVideos(videos.filter(video => videoElementHasProgressBar(video)))
}

async function filterVideos(videos) {
    // const videoIds = videos.map(videoElement => videoElementToVideoId(videoElement))
    const isReversed = (await chrome.storage.sync.get('reversed')).reversed
    if (isReversed) {
        removeVideosOutsideFilter(videos)
    } else {
        removeVideosExistingInFilter(videos)
        filterUnfinishedVideos(videos)
    }
}

function onPage(URL) {
    return getCurrentURL().includes(URL)
}

function onYouTubeSearchResultsPage() {
    return onPage('https://www.youtube.com/results?search_query')
}

function onYouTubeVideo() {
    return onPage('https://www.youtube.com/watch?v=')
}

function onYouTubeShorts() {
    return onPage('https://www.youtube.com/shorts/')
}

function getCurrentURL() {
    return document.location.href
}

function addVideoToFilter(videoId) {
    //console.log('Adding video to filter: ', videoId);
    passWatchedVideo(videoId)
}

function videosAreTheSame(videos1, videos2) {
    if (videos1.length != videos2.length) return false 
    for (var i = 0; i < videos1.length; i++) {
        const videoLink1 = videoElementToVideoId(videos1[i])
        const videoLink2 = videoElementToVideoId(videos2[i])
        if (videoLink1 != videoLink2) return false
    }
    return true
}

function trimToId(link) {
    const youtubeVideoFormat = 'https://www.youtube.com/watch?v='
    const youtubeShortsFormat = 'https://www.youtube.com/shorts/'
    const isYouTubeShorts = link.includes(youtubeShortsFormat)
    const format = isYouTubeShorts ? youtubeShortsFormat : youtubeVideoFormat
    const videoId = link.replace(format, isYouTubeShorts ? 's:' : '').split('&')[0]
    return videoId
}

function videoElementToVideoId(videoElement) {
    const videoLink = videoElement.getElementsByTagName('a').thumbnail.href
    return trimToId(videoLink)
} 

function getVideoResultsOnPage() {
    const videoResultClassName = 'ytd-video-renderer'
    return Array.from(document.getElementsByTagName(videoResultClassName))
}

function trackChangesToSearchResults() {
    const targetNode = document.body
    const config = { childList: true, subtree: true }
    var videos = []

    function searchResultsMutated(mutationList) {

        function evaluateChangesToSearchResults() {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    const newVideos = getVideoResultsOnPage()
                    if (!videosAreTheSame(newVideos, videos)) { // After a mutation to the contents, if the number of videos found is different to previous mutation
                        function newlyLoadedVideos(newVideos, videos) { // Only new videos that haven't gone through the filter will be processed
                            return newVideos.filter(newVideo => !videos.includes(newVideo))
                        }
                        const newlyLoadedVideoElements = newlyLoadedVideos(newVideos, videos)
                        if (newlyLoadedVideoElements.length > 0) {
                            filterVideos(newlyLoadedVideoElements) // Call the filter function
                            videos = Array.from(newVideos)
                        }
                    }
                }
                else console.log('Changes made to subtree')
            }
        }
        
        evaluateChangesToSearchResults()
    }

    const observer = new MutationObserver(searchResultsMutated)
    observer.observe(targetNode, config)    
}

async function evaluatePage() {
    chrome.storage.sync.get('enabled').then(result => {
        console.log(result)
        if (!result.enabled) { return }
        if (onYouTubeVideo() || onYouTubeShorts()) {
            console.log('Now watching video')
            addVideoToFilter(trimToId(getCurrentURL()))
        } else if (onYouTubeSearchResultsPage()) {
            // console.log('Now searching for videos')
            // console.log('Videos on page: ', getVideoResultsOnPage())
            filterVideos(getVideoResultsOnPage());
            trackChangesToSearchResults()
        }    
    }).catch(err => console.log('Error getting enabled: ', err))
}

function listenForURLChanges() {
    chrome.runtime.onMessage.addListener(
        function(req, sender, res) {
            if (req.message == 'urlChanged') evaluatePage()
        }
    )    
}

function initialize() {
    listenForURLChanges()
    evaluatePage()
}

initialize()

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    if (req.message == 'filterPage') evaluatePage()
})

// -------------------------------------------------------------------------

// var sharedPort = chrome.runtime.connect()

// sharedPort.onMessage.addListener(function(msg, sender, sendResponse) {
//     if (msg.func == "beginObservation") {
//         beginObservation(msg.tabId)
//     } else if (msg.func == "beginFilter") {
//         beginFilter(msg.tabId, msg.manual)
//     }
// })

// function beginFilter(tabId, manual) {
//     chrome.storage.sync.get("automaticEnabled", function(autoenabled) {
//         if (autoenabled.automaticEnabled || manual) {
//             getLinks().then(links => { console.log("beginFilter links", links); filter(links, tabId) })
//         }
//     })
// }

// function beginObservation(tabId) {
//     const observer = new MutationObserver(function(mutationList) {
//         console.log('Mutation detected')
//         //beginFilter(tabId, false)
//     })
//     const e = document.getElementById("content")
//     if (e != null) {
//         observer.observe(e, { childList : true, subtree : true })            
//     }
// }

// var removedElements = 0

// function filter(links, tabId) {
//     chrome.storage.sync.get("reversed", function(result) {
//         var i;
//         if (result.reversed) {
//             evaluateReversed(links)
//         } else {
//             for (i = 0; i < (links ? links.length : 0); i++) {
//                 if (links[i] != null) {
//                     evaluate(links[i])
//                 }
//             }    
//         }

//         for (var i = 0; i < elementsToRemove.length; i++) {
//             const e = elementsToRemove[i]
//             e.remove()
//             removedElements++
//         }
//         setRemovedElements(tabId)
//         elementsToRemove = []
//     })
// }

// function setRemovedElements(tabId) {
//     chrome.storage.sync.get("removedElements", function(result) {
//         if (result.removedElements) {
//             result.removedElements[tabId] = removedElements
//         } else {
//             result.removedElements = []
//             result.removedElements[tabId] = removedElements
//         }
//         chrome.storage.sync.set({ "removedElements": result.removedElements })
//     })
// }

// var elementsToRemove = []

// function evaluateReversed(links) {
//     const videoElements = document.getElementsByTagName("ytd-video-renderer")
//     for (var i = 0; i < videoElements.length; i++) {
//         const videoElement = videoElements[i]
//         const linkElement = videoElement.getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")[0].getAttribute('href').split("&")[0]
//         var exists = false
//         for (var j = 0; j < links.length; j++) {
//             const link = links[j]
//             if (link.includes(linkElement)) {
//                 exists = true
//             }
//         }
//         if (!exists) {
//             elementsToRemove.push(videoElement)
//         }
//     }
// }

// function evaluate(link) {
//     const videoElements = document.getElementsByTagName("ytd-video-renderer")
//     console.log("videoElements length: ", videoElements.length)
//     var i;
//     for (i = 0; i < videoElements.length; i++) {
//         const e = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")
//         var linkElement = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")[0]
//         if (linkElement) {
//             const href = linkElement.getAttribute('href').split("&")[0]
//             const exists = link.includes(href)
//             if (exists) {
//                 elementsToRemove.push(videoElements[i])
//             }
//         }
//     }
// }