require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose')
let shortId = require('shortid');
let bodyParser = require('body-parser');
let validURL = require('valid-url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({
	original_url: String,
	short_url: String
});

let Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
	res.json({ greeting: 'hello API' });
});

// shortcut the url
app.post('/api/shorturl', async function(req, res) {
	const url = req.body.url;
	const urlShort = shortId.generate();

	if (validURL.isWebUri(url) === undefined) {
    res.json({
      error: 'invalid url',
    }); 
	} else {
		let newUrl = new Url({original_url: url, short_url: urlShort}) 
		await newUrl.save();
	
	res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url});
	}
	
});

// Get the path
app.get('/api/shorturl/:short_url?', async function(req, res) {
	let shortUrl = req.params.short_url;
	const urlRedirect = await Url.findOne({short_url: shortUrl});
	res.redirect(urlRedirect.original_url)
});


app.listen(port, function() {
	console.log(`Listening on port ${port}`);
});

