// document.addEventListener('DOMContentLoaded', function() {
//     var automaticCheckbox = document.getElementById("automaticCheckbox")

//     chrome.storage.sync.get("automaticEnabled", function(enabled) {
//         automaticCheckbox.checked = (enabled.automaticEnabled != null ? enabled.automaticEnabled : false)
//         automaticCheckbox.addEventListener('click', function() {
//             toggleEnabled()
//         })    
//     })
// })

// function toggleEnabled() {
//     var enableBox = document.getElementById("automaticCheckbox")
//     chrome.storage.sync.get("automaticEnabled", function(enabled) {
//         chrome.storage.sync.set({ "automaticEnabled" : (enabled.automaticEnabled != null ? !enabled.automaticEnabled : true) })
//         chrome.storage.sync.get("automaticEnabled", function(enabled) {
//             console.log(enabled.automaticEnabled)
//         })
//     })   
// }

async function setLoadedFile(url) {
    chrome.storage.local.set({'archivedVideoLinks' : url}).then(_ => console.log('Saved file'))
}

function getFilePath(file) {
    return URL.createObjectURL(file)
}

function handleFile() {
    const file = document.getElementById("localData").files[0]
    const path = getFilePath(file)
    setLoadedFile(path)
    //getDataFromURL(path)
    //console.log('File uploaded: ', file)
    //fileReader.readAsText(file)
    //fileReader.addEventListener("load", () => { console.log("Contents of uploaded file: ", fileReader.result) }, false)
    //setLoadedFile(file)
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Options page loaded!')
    const inputElement = document.getElementById("localData")
    inputElement.addEventListener("change", handleFile, false)
})