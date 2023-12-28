console.log('Popup executing')

document.addEventListener('DOMContentLoaded', () => {
    initializePopup()
    getFilteredVideosCount().then(n => {
        var filterCount = document.getElementById('filteredOnPage')
        filterCount.textContent = 'Filtered on page: ' + n
    })
    getTotalVideosCount().then(n => {
        var videosAdded = document.getElementById('totalFiltered')
        videosAdded.textContent = 'Videos added: ' + n
    })
})

function initializeCheckbox(checkbox, storageKey, callback) {
    checkbox.addEventListener('change', callback)
    chrome.storage.sync.get(storageKey).then(result => { checkbox.checked = result[storageKey] })
}

function initializePopup() {
    var enableCheckbox = document.getElementById("enableCheckbox")
    var reversedCheckbox = document.getElementById("reversedCheckbox")
    initializeCheckbox(enableCheckbox, 'enabled', enableClicked)
    initializeCheckbox(reversedCheckbox, 'reversed', reversedClicked)
}

function enableClicked() {
    console.log('Enable button clicked')
    var enableCheckbox = document.getElementById("enableCheckbox")
    chrome.storage.sync.set({enabled: enableCheckbox.checked}, () => console.log('Success'))
}

function reversedClicked() {
    console.log('Reversed button clicked')
    var reversedCheckbox = document.getElementById("reversedCheckbox")
    chrome.storage.sync.set({reversed: reversedCheckbox.checked}, () => console.log('Success'))
}

async function getCurrentTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            resolve(tabs[0])
        });    
    })
}

async function getFilteredVideosCount() {
    return new Promise(function(resolve, reject) {
        getCurrentTab().then(tab => {
            chrome.runtime.sendMessage({ message: {func: 'getFilteredVideosCount', tab: tab} }, (res) => { resolve(res.videosFiltered) })
        })
    })
}

async function getTotalVideosCount() {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage({ message: {func: 'getTotalVideosCount'} }, (res) => { resolve(res.totalVideos) })
    })
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