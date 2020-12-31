document.addEventListener('DOMContentLoaded', function() {
    const backgroundPage = chrome.extension.getBackgroundPage()

    var filterButton = document.getElementById("filterButton")
    filterButton.addEventListener('click', function() {
        beginFilter()
    })
    var clearButton = document.getElementById("clearButton")
    clearButton.addEventListener('click', function() {
        backgroundPage.clearList()
    })

    var enableBox = document.getElementById("enableCheckbox")

    chrome.storage.sync.get("enabled", function(enabled) {
        enableBox.checked = (enabled.enabled != null ? enabled.enabled : false)
        enableBox.addEventListener('click', function() {
            toggleEnabled()
        })    
    })

    chrome.storage.sync.get("data", function(result) {
        const txt = document.getElementById("totalFiltered")
        txt.textContent = "Total filtered: " + result.data.length
    })

    chrome.storage.sync.get("removedElements", function(result) {
        const txt = document.getElementById("filteredOnPage")
        txt.textContent = "Filtered on page: " + result.removedElements
    })
})

function toggleEnabled() {
    chrome.storage.sync.get("enabled", function(enabled) {
        var enableBox = document.getElementById("enableCheckbox")
        chrome.storage.sync.set({ "enabled" : (enabled.enabled != null ? !enabled.enabled : enableBox.checked) })
    })
}

function beginFilter() {
    //console.log("Filtering process to begin")
    const backgroundPage = chrome.extension.getBackgroundPage()
    backgroundPage.filterResults()
}