chrome.runtime.onMessage.addListener(function(msg) {
    if (msg == "beginObservation") {
        beginObservation()
    } else if (msg == "beginFilter") {
        beginFilter()
    }
})

function beginFilter() {
    chrome.storage.sync.get("data", function(result) {
        const links = result.data
        filter(links)
    })    
}

const observer = new MutationObserver(function(mutationList) {
    if (mutationList[0].oldValue == "") {
        chrome.runtime.sendMessage(null, "updateToPage")
    }
})

function beginObservation() {
    const root = document.getElementById("primary").getElementsByTagName("ytd-section-list-renderer")[0]
    console.log(root)
    if (root != null) {
        console.log(root)
        observer.observe(root, { attributes : true, attributeOldValue : true })            
    }
}

function filter(links) {
    console.log("filter")
    var i;
    for (i = 0; i < links.length; i++) {
        if (links[i] != null) {
            evaluate(links[i])
        }
    }
}

function evaluate(link) {
    console.log("evaluate")
    const videoElements = document.getElementsByTagName("ytd-video-renderer")
    var i;
    for (i = 0; i < videoElements.length; i++) {
        const e = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")
        var linkElement = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")[0]
        if (linkElement) {
            const href = linkElement.getAttribute('href')
            console.log(href)
            if (link.includes(href)) {
                console.log(videoElements[i])
                console.log("remove ")
                videoElements[i].remove()
            }
        }
    }
}