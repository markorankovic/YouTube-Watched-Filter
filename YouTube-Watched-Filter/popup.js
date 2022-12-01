console.log('Popup executing')

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getFilteredVideos(tabId) {
    
}

// document.addEventListener('DOMContentLoaded', async function() {
//     const backgroundPage = chrome.extension.getBackgroundPage()

//     var filterButton = document.getElementById("filterButton")
//     filterButton.addEventListener('click', function() {
//         beginFilter()
//     })
//     var clearButton = document.getElementById("clearButton")
//     clearButton.addEventListener('click', function() {
//         backgroundPage.clearList()
//     })

//     var enableBox = document.getElementById("enableCheckbox")

//     chrome.storage.sync.get("enabled", function(enabled) {
//         enableBox.checked = (enabled.enabled != null ? enabled.enabled : false)
//         enableBox.addEventListener('click', function() {
//             toggleEnabled()
//         })    
//     })

//     var reversedBox = document.getElementById("reversedCheckbox")

//     chrome.storage.sync.get("reversed", function(reversed) {
//         reversedBox.checked = (reversed.reversed != null ? reversed.reversed : false)
//         reversedBox.addEventListener('click', function() {
//             toggleReversed()
//         })    
//     })

//     const links = await getLinks()
//     const txt = document.getElementById("totalFiltered")
//     txt.textContent = "Videos added: " + (links.length ? links.length : 0)    

//     //const tab = await backgroundPage.getCurrentTab()

//     chrome.storage.sync.get("removedElements", function(result) {
//         const txt = document.getElementById("filteredOnPage")
//         txt.textContent = "Filtered on page: " + 0 // Need to get the tab of the current page Requires current tab
//     })
// })

// function toggleEnabled() {
//     chrome.storage.sync.get("enabled", function(enabled) {
//         var enableBox = document.getElementById("enableCheckbox")
//         chrome.storage.sync.set({ "enabled" : (enabled.enabled != null ? !enabled.enabled : enableBox.checked) })
//     })
// }

// function toggleReversed() {
//     chrome.storage.sync.get("reversed", function(reversed) {
//         var reversedBox = document.getElementById("reversedCheckbox")
//         chrome.storage.sync.set({ "reversed" : (reversed.reversed != null ? !reversed.reversed : reversedBox.checked) })
//     })
// }

// function beginFilter() {
//     chrome.storage.sync.get("enabled", function(enabled) {
//         if (enabled.enabled) {
//             postMessage({func: "beginFilter", tabId: null, manual: null})
//         }
//     })
// }