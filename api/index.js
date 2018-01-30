const request = require('request');
const cheerio = require('cheerio');

const config = require('../config');

function getSearchURL(term) {
    return config.BASE_URL + config.SEARCH_URL + term.split(' ').map(s => encodeURIComponent(s)).join('+');
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        request({
                    uri: url,
                    headers: {
                        'User-Agent': config.USER_AGENT
}
}, (err, res, body) => {
        if (err != null) {
            reject((typeof err !== 'object') ? new Error(err) : err);
            return;
        }

        // if the request was not a success for some reason
        if (res.statusCode.toString()[0] !== '2') {
            reject(new Error('Status Code ' + res.statusCode));
            return;
        }

        resolve(body);
    });
})
}

async function findFirstSearchResult(term) {
    let body;
    try {
        body = await makeRequest(getSearchURL(term));
    }
    catch (e) {
        throw e;
    }

    if (body.includes('Sorry, but there were no results for')) {
        throw new Error('No results found.');
    }

    const $ = cheerio.load(body);

    const grid = $('.entry-grid-body');
    const searchItem = grid.find('tr td a')[0];

    return config.BASE_URL + searchItem.attribs.href;
}

function childrenToText(children) {
    let text = '';

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.type === 'text') {
            if (!/^\s*\[\d+]\s*$/.test(child.data))
            {
                text += child.data;
            }

            continue;
        }

        text += childrenToText(child.children);
    }

    return text;
}

function parseMemeBody(body) {
    const $ = cheerio.load(body);

    const name = $('.info h1 a')[0].children[0].data;
    const about = $('.bodycopy');

    const children = about.children();

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.attribs.id === 'about') {
            return {  name, about: childrenToText(children[i + 1].children) };
        }
    }

    const paragraphs = about.find('p');

    if (paragraphs && paragraphs.length !== 0) {
        const text = childrenToText(paragraphs);

        if (text && text.trim() !== '') {
            return { name, about: text };
        }
    }

    return null;
}

/**
 * Search for a given term.
 * @param term {string} - The search term for which to search on.
 * @returns {Promise.<object>} - A promise which resolves to a meme object
 */
async function doSearch(term) {
    let resultUrl;
    try {
        resultUrl = await findFirstSearchResult(term);
    } catch (e) {
        throw e;
    }

    let body;
    try {
        body = await makeRequest(resultUrl);
    } catch (e) {
        throw e;
    }

    return parseMemeBody(body);
}

/**
 * Get a random meme.
 * @returns {Promise.<object>} - A promise which resolves to a meme object
 */
async function doRandomSearch(tries = 3) {
    let body;
    try {
        body = await makeRequest(config.BASE_URL + config.RANDOM_URL);
    } catch (e) {
        if (tries > 0) {
            return doRandomSearch(--tries);
        }

        throw e;
    }

    const parsed = parseMemeBody(body);

    if (!parsed && tries > 0) {
        return doRandomSearch(--tries);
    }

    return parsed;
}

module.exports = { search: doSearch, random: doRandomSearch };