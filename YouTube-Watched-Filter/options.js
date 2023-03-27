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

const fileReader = new FileReader()

function handleFile() {
    const file = document.getElementById("localData").files[0]
    console.log('File uploaded: ', file)
    fileReader.readAsText(file)
    fileReader.addEventListener("load", () => { console.log("Contents of uploaded file: ", fileReader.result) }, false)
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Options page loaded!')
    const inputElement = document.getElementById("localData")
    inputElement.addEventListener("change", handleFile, false)
})