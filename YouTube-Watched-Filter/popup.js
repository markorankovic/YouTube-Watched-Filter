document.addEventListener('DOMContentLoaded', function() {
    const backgroundPage = chrome.extension.getBackgroundPage()

    var filterButton = document.getElementById("filterButton")
    filterButton.addEventListener('click', function() {
        beginFilter()
    })
    var clearButton = document.getElementById("clearButton")
    clearButton.addEventListener('click', function() {
        //console.log("Clear button pressed")
        backgroundPage.clearList()
    })

    var enableBox = document.getElementById("enableCheckbox")

    chrome.storage.sync.get("enabled", function(enabled) {
        enableBox.checked = (enabled.enabled != null ? enabled.enabled : false)
        enableBox.addEventListener('click', function() {
            toggleEnabled()
        })    
    })

    var reversedBox = document.getElementById("reversedCheckbox")

    chrome.storage.sync.get("reversed", function(reversed) {
        reversedBox.checked = (reversed.reversed != null ? reversed.reversed : false)
        reversedBox.addEventListener('click', function() {
            toggleReversed()
        })    
    })


    backgroundPage.getLinks().then(links => {
        //console.log("Links: ", links)
        const txt = document.getElementById("totalFiltered")
        txt.textContent = "Videos added: " + (links.length ? links.length : 0)
    })

    chrome.tabs.getSelected(null, function(tab) {
        chrome.storage.sync.get("removedElements", function(result) {
            const txt = document.getElementById("filteredOnPage")
            txt.textContent = "Filtered on page: " + (result?.removedElements[tab.id] ?? 0)
        })
    })
})

function toggleEnabled() {
    chrome.storage.sync.get("enabled", function(enabled) {
        var enableBox = document.getElementById("enableCheckbox")
        chrome.storage.sync.set({ "enabled" : (enabled.enabled != null ? !enabled.enabled : enableBox.checked) })
    })
}

function toggleReversed() {
    chrome.storage.sync.get("reversed", function(reversed) {
        var reversedBox = document.getElementById("reversedCheckbox")
        chrome.storage.sync.set({ "reversed" : (reversed.reversed != null ? !reversed.reversed : reversedBox.checked) })
    })
}

function beginFilter() {
    chrome.storage.sync.get("enabled", function(enabled) {
        if (enabled.enabled) {
            const backgroundPage = chrome.extension.getBackgroundPage()
            backgroundPage.filterResults(true)    
        }
    })
}