console.log('background.js executing')

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.videoId) {
            sendResponse('Video ' + request.videoId + ' has been received')
            storeVideo(request.videoId)
        }
    }
)

function storeVideo(videoId) {
    console.log('Storing video ' + videoId)
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