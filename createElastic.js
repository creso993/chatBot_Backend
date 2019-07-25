var elasticsearch = require('elasticsearch');
const axios = require('axios');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const request = require('request');
dotenv.config();
const PORT = process.env.PORT;
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./DB.js');
const fetch = require('node-fetch');

app.use(express.static("public"));
mongoose.Promise = global.Promise;
mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database'+ err)}
);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


/*client.create({
    index: 'chatbot',
    type: 'training',
    id: '2',
    body: {
      title: 'Test 2',
      tags: ['y', 'z'],
      published: true,
      published_at: '2013-01-01',
      counter: 1
    }
  });*/
let Training = require('./model/chat.model');
app.get('/insertlast',async(req,res)=>{
    let newlist={};
    await Training.find(function(err,train){
    if(err){
        console.log(err);
    }
    else{
        newlist = train;
    }})
    console.log(newlist);
    for (let xxx of newlist){
      
        await fetch('http://localhost:9200/chatbot/training', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({"entities" : xxx.entities,
            "params" : xxx.params,
            "intent" : xxx.intent,
            "question":xxx.question,
            "default_answer":xxx.default_answer,
            "answer":xxx.answer
        }),
        })
            .then(res =>{console.log(res)}).catch(err=>{console.log(err)});
    }
})



app.listen(PORT, function(){
    console.log('Server is running on Port:',PORT);
  });

/*for(let item of newlist){
    console.log({
    index: 'chatbot',
    type: 'training',
    id: item._id,
    body: item
})
}*/
 /* client.delete({
    index: 'chatbot',
    type: 'training',
    id: '2'
  });*/
  app.get('/dellast',async(req,res)=>{
    client.delete({
        index: 'chatbot',
        type: 'training',
        id: '1'
      });
  })
app.get('/viewlist',async(req,res)=>{
    client.search({
        index: 'chatbot',
        type: 'training',
       
      }).then(function (resp) {
          var hits = resp.hits.hits;
          res.json(hits.map(item=>{return item._source}));
      }, function (err) {
          console.trace(err.message);
      });
})
  app.get('/create',(req,res)=>{
      client.create({
    index: 'chatbot1',
    type: 'training1',
    id: '1',
    body: {"entities" : {},
    "params" : "",
    "intent" : "Greeting",
    "question":"Hi",
    "default_answer":"Hi",
    "answer":"Hi"
}
  });
  })
  app.get('/test',(req,res)=>{
    client.search({
        index: 'chatbot',
        type: 'training',

      }).then(function (resp) {
          var hits = resp.hits.hits;
          res.json(hits[1]);
      }, function (err) {
          console.trace(err.message);
      });
});