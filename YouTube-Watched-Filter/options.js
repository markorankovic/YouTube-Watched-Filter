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

async function exportDatabase() {
    console.log('Exporting the database')
    const videos = (await chrome.storage.sync.get('watchedVids')).watchedVids
    console.log('Exporting videos: ', videos)
    const res = await window.showSaveFilePicker({types: [{description: 'JSON file', accept: {'application/json': ['.json']}}]})
    console.log(res)
    const writable = await res.createWritable()
    await writable.write(JSON.stringify(videos))
    await writable.close()
}

async function importDatabase() {
    const res = await window.showOpenFilePicker()
    const handle = res[0]
    const file = await handle.getFile()
    const data = await getDataFromURL(getFilePath(file))
    console.log('JSON.parse(data): ', JSON.parse(data))
    chrome.storage.local.set({'archivedVideoLinks' : JSON.parse(data)})
}

async function getDataFromURL(url) {
    let blob = await fetch(url).then(r => r.blob()).catch(e => console.log('error: ', e));
    const fileReader = new FileReader()
    fileReader.readAsText(blob)
    return new Promise((resolve, _) =>
      fileReader.addEventListener("load", () => { resolve(fileReader.result) }, false)
    )
}

function clearDatabase() {
    chrome.runtime.sendMessage({message: 'resetLocal'})
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Options page loaded!')

    const importButton = document.getElementById("import")
    importButton.addEventListener("click", importDatabase, false)

    const exportButton = document.getElementById("export")
    exportButton.addEventListener("click", exportDatabase, false)

    const clearButton = document.getElementById("clear")
    clearButton.addEventListener("click", clearDatabase, false)
})