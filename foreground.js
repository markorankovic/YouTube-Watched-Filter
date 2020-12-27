console.log("Entered foreground")

chrome.storage.sync.get("toFilter", function(result) {
    const links = result.toFilter
    filter(links)
})

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