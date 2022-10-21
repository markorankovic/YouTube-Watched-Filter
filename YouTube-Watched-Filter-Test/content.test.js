const puppeteer = require('puppeteer');
var browser = null
var page = null

const initialize = async () => {
    const path = 'C:\\Users\\marko\\Documents\\GitHub\\YouTube-Watched-Filter\\YouTube-Watched-Filter' // Todo: Check for single escape character
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
            `--disable-extensions-except=${path}`,
            `--load-extension=${path}`,
            `--window-size=800,600`
            ]
        })
        const extensionID = 'ikbancdjpfdmljjlfjmloclldceibkoe'
        const page = await browser.newPage()
        await page.goto(`chrome-extension://${extensionID}/_generated_background_page.html`)
        return Promise.resolve(page)
    }
    catch (err) {
        console.error(err)
    }
}

beforeAll(async () => {
    page = await initialize()
})

test('YouTube link is trimmed to video ID', async () => {
    const expectedRes = 'azfup51PURc'  

    await page.evaluate(async () => {
        const someLink = 'https://www.youtube.com/watch?v=azfup51PURc'
        return trimToId(someLink)
    })
    .then(res => expect(res).toBe(expectedRes))    
})

test('List of videos is empty', async () => {
    await page.evaluate(async () => {
        const length = getLinks().length
        return Promise.resolve(length)
    })
    .then(length => expect(!length).toBeTruthy())    
})

test('1 video stored', async () => {
    await page.evaluate(async () => {
        await setLinks(['https://www.youtube.com/watch?v=wmOePNsNFw0'])
        return Promise.resolve((await getLinks()).length)
    }).then(length => expect(length == 1).toBeTruthy())    
})

test('Link is to a YouTube video', async () => {
    await page.evaluate(async () => {
        return Promise.resolve((await isYouTubeVideo('https://www.youtube.com/watch?v=wmOePNsNFw0')))
    }).then(isYouTubeVideo => expect(isYouTubeVideo).toBeTruthy())    
})

test('Link is not to a YouTube video', async () => {
    await page.evaluate(async () => {
        return Promise.resolve((await isYouTubeVideo('gkjreiogjioer')))
    }).then(isYouTubeVideo => expect(isYouTubeVideo).not.toBeTruthy())    
})

test('Clear list', async () => {
    await page.evaluate(() => {
        setLinks(['https://www.youtube.com/watch?v=wmOePNsNFw0'])
        clearList()
        return Promise.resolve(getLinks().length)
    }).then(length => expect(!length).toBeTruthy())    
})

afterAll(async () => {
    await browser.close()
})