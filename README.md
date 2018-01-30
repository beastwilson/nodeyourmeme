# nodeyourmeme
Know your meme web scraper API for node.js!

This module can search for any term, or get a random meme, and return all the information inside its "about" section.

## Usage:
```javascript
const nodeyourmeme = require('nodeyourmeme');

nodeyourmeme.search('ugandan knuckles').then(console.log).catch(console.error);
nodeyourmeme.random().then(console.log).catch(console.error);
```

## Methods:

The following methods return a "meme promise", which is a promise that resolves to an object with the properties `name` (the name of the meme) and `about` (the text from the "about" section of the meme, both strings.

`search(term)` - Takes a string input for the search term

`random()` - Gets a random meme