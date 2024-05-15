require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const urlparser = require('urlparser');
const dns = require('dns');

// Establish MongoDB connection
const client = new MongoClient(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

// Connect to MongoDB and access the collection
let urls;
client.connect()
    .then(() => {
        console.log("Connected to MongoDB");
        const db = client.db('urlshortener');
        urls = db.collection('urls');
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });
    
// Root path handler
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  console.log(req.body);
  const url = req.body.url;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    dns.lookup(hostname, async (err, address) => {
      if (err || !address) {
        res.json({ error: 'Invalid URL' });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount
        };

        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({ original_url: url, short_url: urlCount });
      }
    });
  } catch (error) {
    console.error("Error parsing URL:", error);
    res.json({ error: 'Invalid URL' });
  }
});


app.get("/api/short_url/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({ error: "Short URL not found" });
  }
});


app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});
