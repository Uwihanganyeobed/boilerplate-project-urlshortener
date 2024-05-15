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

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
    console.log(req.body);
    const url = req.body.url;
    const hostname = urlparser.parse(url).hostname;

    dns.lookup(hostname, async(err, address) => {
        if (!address) {
            res.json({ error: 'Invalid url' });
        } else {
            try {
                await client.connect(); // Connect to MongoDB
                const db = client.db('urlshortener');
                const urls = db.collection('urls');
                const urlCount = await urls.countDocuments({});
                const urlDoc = {
                    url,
                    short_url: urlCount
                };
                const result = await urls.insertOne(urlDoc);
                console.log(result);
                res.json({ original_url: url, short_url: urlCount });
            } catch (error) {
                console.error("Error inserting document:", error);
                res.status(500).json({ error: 'Internal server error' });
            } finally {
                await client.close(); // Close MongoDB connection
            }
        }
    });
});

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});
