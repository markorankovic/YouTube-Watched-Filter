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

function getFilePath(file) {
    return URL.createObjectURL(file)
}

async function importDatabase() {
    const res = await window.showOpenFilePicker()
    const handle = res[0]
    const file = await handle.getFile()
    const data = await getDataFromURL(getFilePath(file))
    chrome.storage.local.set({'archivedVideoLinks' : data})
}

async function getDataFromURL(url) {
    let blob = await fetch(url).then(r => r.blob()).catch(e => console.log('error: ', e));
    const fileReader = new FileReader()
    fileReader.readAsText(blob)
    return new Promise((resolve, _) =>
      fileReader.addEventListener("load", () => { resolve(fileReader.result) }, false)
    )
}  

document.addEventListener('DOMContentLoaded', () => {
    console.log('Options page loaded!')

    const importButton = document.getElementById("import")
    importButton.addEventListener("click", importDatabase, false)
})