const express = require('express');
const chatRoutes = express.Router();
const fetch = require('node-fetch');
const { Wit } = require('node-wit');
const client = new Wit({
    accessToken: process.env.WIT_ACCESS_TOKEN,
  });

let Training = require('../model/chat.model');
async function result(){
  let question = await Training.find({intent:"Question"});
  let greeting = await Training.find({intent:"greeting"});
  return question;
}
async function getResFromWit(data){
  let witRes ;
  let stringquery = await Training.find({question:{$regex: new RegExp('^' + data, 'i')}});
  if (stringquery.length===1){
    return stringquery[0].answer;
  }
  await client.message(data).then(r=>witRes = r);
  
  let listEntity =[];
  if (Object.keys(witRes.entities).length===0){
    return "";
  }
  Object.keys(witRes.entities).forEach(function(key, idx) {
    if(key !== "intent"){
      listEntity.push(key);
    }
  }); 
  let params = listEntity.join(',');
  let dbquerry = await Training.find({intent: witRes.entities.hasOwnProperty('intent')?witRes.entities.intent[0].value:"",params:params});
  let listAnswer = JSON.parse(JSON.stringify(dbquerry));
  if (dbquerry.length>0){
    if(params.length>0){
     for (let item of listEntity){
        listAnswer = listAnswer.filter(entity=>entity.entities[item].sort().join(',').toLowerCase()===witRes.entities[item].map(i=>{return i.value}).sort().join(',').toLowerCase())
     }
      if(listAnswer.length>1){ 
        return listAnswer[0].default_answer;
      }
      else if(listAnswer.length===1){
        return listAnswer[0].answer;
      }
      else{
        return ""
      }

      }
    else{
      return dbquerry[0].default_answer
     
    }
  }else{
    return "";
   
  }
  }



chatRoutes.route('/send').post(async function (req, res) {
    let training = req.body;
    let confirm = await sender(training);
    if (confirm){
      training = new Training(req.body);
      training.save()
        .then(train => {
            res.json({
                status:true,
                message:"Lưu thành công"
            });
        })
        .catch(err => {
            res.json({
                status:false,
                message:"Lưu thất bại"
            });
        });
    }
    else{
      res.json({
        status:false,
        message:"Có lỗi với server wit ai"
      })
    }
});
chatRoutes.route('/sendtraining').get(async function (req, res) {
   let a = await sender(req,res);
})
 async function sender(object){
   let confirm = false;
    let a={entity:"",value:""};
  
    let entities = object.entities;
    let tempentity =[];
    let tempkey = Object.keys(entities)
    for (let item of tempkey){
      for (let values of entities[item]){
        a.entity = item;
        a.start = object.question.toLowerCase().indexOf(values.toLowerCase()),
        a.end = object.question.toLowerCase().indexOf(values.toLowerCase()) + values.length,
        a.value = values;
        tempentity.push(a);
        a={};
      }
    }

     let envo ={
        "text": object.question,
        "entities": [{
          "entity":"intent",
          "value":object.intent
        },
          ...tempentity
        ],
        }
        console.log(envo);
    await fetch('https://api.wit.ai/samples?v=201703077', {
        method: 'POST',
        headers: {
        Authorization: 'Bearer '+process.env.WIT_ACCESS_TOKEN
        ,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify([envo]),
    })
        .then(res =>{confirm = true;}).catch(err=>{confirm = false});
        return confirm;
}
chatRoutes.route('/message').post(async function(req,res){
    const message = req.body.message;
    let tempres;
    tempres = await getResFromWit(req.body.message);
    res.send({"mess":tempres,"flag":2});

})

chatRoutes.route('/update/:id').post(function(req,res){
    Training.findById(req.params.id,function(err,card){
        if(!card){
            res.status(404).send("Data is not found");

        }
        else{
           //save here
           //gán các thuộc tính mới và cũ
            card.save().then(train => {
                res.json({
                    status:true,
                    message:"Lưu thành công"
                });
            })
            .catch(err => {
                res.json({
                    status:false,
                    message:"Lưu thất bại"
                });
            });
        }
    });
})

chatRoutes.route('/delete/:id').get(function(req,res){
    Training.findByIdAndRemove({_id:req.params.id}, function(err,per){
        if (err) res.json(err);
        else res.json('Successfully removed');
    })
 })
chatRoutes.route('/getDefaultAnswer').post(async function(req,res){
  let sametype = await Training.find({intent:req.body.intent,params:req.body.params})
  console.log("get default answer");
  console.log(sametype)
  if (sametype.length>0){
    res.json({default_answer:sametype[0].default_answer})
  }
  else{
    res.json({default_answer:""})
  }
})
chatRoutes.route('/listEntity').get(function(req,res){
  res.json({
    entities:["Intent","Place","People","Object"],
    intent:["HowQuestion","WhatQuestion","Question","Greeting"]
  });
})

module.exports = chatRoutes;