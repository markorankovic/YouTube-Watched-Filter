console.log('foreground.js executing')

function filterWatchedVideos() {
    console.log('Filtering watched videos')
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

function getCurrentURL() {
    return document.location.href
}

function addVideoToFilter() {
    console.log('Adding video to filter');
}

function trackChangesToContents() {
    const targetNode = document.getElementById('content')
    const config = { childList: true, subtree: true }
    var videosCount = 0
    var currentURL = getCurrentURL()

    function contentsMutated(mutationList) {
        const acceptedPages = onYouTubeSearchResultsPage() || onYouTubeVideo()
        if (!acceptedPages) return

        function evaluateChangesToVideo() {
            const newVideoURL = getCurrentURL()
            const switchedVideo = currentURL != newVideoURL
            if (switchedVideo) {
                addVideoToFilter()
                currentURL = newVideoURL
                return 
            } // If watching a YouTube video, add it to filter    
        }

        if (onYouTubeVideo()) {
            evaluateChangesToVideo()
        }

        function evaluateChangesToSearchResults() {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    const videoResultClassName = 'ytd-video-renderer'
                    const newVideosCount = document.getElementsByTagName(videoResultClassName).length
                    if (newVideosCount !== videosCount) { // After a mutation to the contents, if the number of videos found is different to previous mutation
                        filterWatchedVideos() // Call the filter function
                        videosCount = newVideosCount
                    }
                }
                else console.log('Changes made to subtree')
            }    
        }

        evaluateChangesToSearchResults()
    }

    const observer = new MutationObserver(contentsMutated)
    observer.observe(targetNode, config)
}

function initialize() {
    if (onYouTubeVideo()) addVideoToFilter()
    trackChangesToContents()
}

initialize()

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