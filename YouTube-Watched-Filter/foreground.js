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
        const watched = await videoExists(videoElementToVideoId(videoLoaded))
        const unfinishedVideo = videoElementHasProgressBar(videoLoaded)
        if (!watched && !unfinishedVideo) videosToRemove.push(videoLoaded)
    }
    getExistingVideos(videosLoaded.filter(video => !videosToRemove.includes(video)))
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