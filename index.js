require('dotenv').config();
const DB_URL='mongodb+srv://UwihanganyeObed:sun(123)@cluster0.gvdipjg.mongodb.net/url-shortner?retryWrites=true&w=majority&appName=Cluster0'
const express = require('express');
const cors = require('cors');
const app = express();
const {MongoClient} = require('mongodb');
const urlparser = require('urlparser');
const dns= require('dns');

const client= new MongoClient(process.env.DB_URL);
const db= client.db('urlshortner')
const urls=db.collection('urls')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body)
  const url= req.body.url
  const dnslookup= dns.lookup(urlparser.parse(url).hostname,
async(err, address)=>{
  if(!address){
    res.json({error: 'Invalid url'})
  }else{
    const urlCount= await urls.countDocuments({})
    const urlDoc= {
      url,
      short_url: urlCount
    }
    const result = await urls.insertOne(urlDoc)
    console.log(result)
    res.json({original_url: url, short_url: urlCount})
  }
})
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
