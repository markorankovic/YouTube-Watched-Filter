document.addEventListener('DOMContentLoaded', function() {
    var automaticCheckbox = document.getElementById("automaticCheckbox")

    chrome.storage.sync.get("automaticEnabled", function(enabled) {
        automaticCheckbox.checked = (enabled.automaticEnabled != null ? enabled.automaticEnabled : false)
        automaticCheckbox.addEventListener('click', function() {
            toggleEnabled()
        })    
    })
})

function toggleEnabled() {
    var enableBox = document.getElementById("automaticCheckbox")
    chrome.storage.sync.get("automaticEnabled", function(enabled) {
        console.log(!enabled.automaticEnabled)
        chrome.storage.sync.set({ "automaticEnabled" : (enabled.automaticEnabled != null ? !enabled.automaticEnabled : false) })
    })   
}