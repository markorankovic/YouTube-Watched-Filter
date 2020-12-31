const observer = new MutationObserver(function(mutationList) {
    //console.log(mutationList)
    chrome.runtime.sendMessage(null, "updateToPage")
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
        const links = result.data
        filter(links)
    })    
}

function beginObservation(observer) {
    const e = document.getElementById("contents")
    //console.log("Element of interest")
    //console.log(e)
    //const root = document.getElementById("primary").getElementsByTagName("ytd-section-list-renderer")[0]
    if (e != null) {
        observer.observe(e, { childList : true, subtree : true })            
    }
}

var removedElements = 0

function filter(links) {
    //console.log("filter")
    //removedElements = 0
    var i;
    for (i = 0; i < links.length; i++) {
        if (links[i] != null) {
            evaluate(links[i])
        }
    }
    chrome.storage.sync.set({ "removedElements" : removedElements })
}

function evaluate(link) {
    //console.log("evaluate: " + link)
    const videoElements = document.getElementsByTagName("ytd-video-renderer")
    var i;
    for (i = 0; i < videoElements.length; i++) {
        const e = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")
        var linkElement = videoElements[i].getElementsByClassName("yt-simple-endpoint style-scope ytd-thumbnail")[0]
        if (linkElement) {
            const href = linkElement.getAttribute('href')
            //console.log(href)
            if (link.includes(href)) {
                videoElements[i].remove()
                removedElements++
                //console.log(removedElements + " removed")
            }    
        }
    }
}