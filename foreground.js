var removedElements = 0
chrome.storage.sync.set({ "removedElements" : removedElements })

const observer = new MutationObserver(function(mutationList) {
    console.log("Mutation detected")
    if (mutationList[0].oldValue == "") {
        chrome.runtime.sendMessage(null, "updateToPage")
    }
})

chrome.runtime.onMessage.addListener(function(msg) {
    if (msg == "beginObservation") {
        beginObservation(observer)
    } else if (msg == "beginFilter") {
        beginFilter()
    }
})

function beginFilter() {
    chrome.storage.sync.get("data", function(result) {
        removedElements = 0
        const links = result.data
        filter(links)
    })    
}

function beginObservation(observer) {
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
    chrome.storage.sync.set({ "removedElements" : removedElements })
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
                removedElements++
            }
        }
    }
}