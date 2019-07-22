const express = require('express');
const chatRoutes = express.Router();
const wit = require('../model/Wit');
const fetch = require('node-fetch');
const { Wit } = require('node-wit');
const request = require('request');
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
  
  if (stringquery.length===1 && stringquery[0].question.toLowerCase() === data.toLowerCase()){
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
  
  let params = listEntity.sort().join(',');
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
        return dbquerry[0].default_answer;
      }

      }
    else{
      return dbquerry[0].default_answer;
     
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
        let sende = new wit();
        confirm = await sende.trainingQuestion(object.question,[{
          "entity":"intent",
          "value":object.intent
        },
          ...tempentity
        ])
        return confirm.sent?true:false;
    /*await fetch('https://api.wit.ai/samples?v=201703077', {
        method: 'POST',
        headers: {
        Authorization: 'Bearer '+process.env.WIT_ACCESS_TOKEN
        ,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify([envo]),
    })
        .then(res =>{confirm = true;}).catch(err=>{confirm = false});
        return confirm;*/
}
chatRoutes.route('/message').post(async function(req,res){
    const message = req.body.message;
    let tempres;
    tempres = await getResFromWit(req.body.message);
    res.send({"mess":tempres,"flag":2});

})

chatRoutes.route('/updateTraining/:id').post(async function(req,res){
    let training = req.body;
    let confirm = await sender(training);
    if (confirm){
      Training.findById(req.params.id,function(err,train){
        if(!train){
            res.json({
              status:false,
              message:"Lưu thất bại"
          });
        }
        else{
           //save here
           //gán các thuộc tính mới và cũ
           train.entities = req.body.entities;
           train.answer = req.body.answer;
           train.params = req.body.params;
           train.intent = req.body.intent;
           train.save().then(train => {
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
    }
    else{
      res.json({
        status:false,
        message:"Có lỗi với server wit ai"
      })
    }
   
})

chatRoutes.route('/delete/:id').get(function(req,res){
    Training.findByIdAndRemove({_id:req.params.id}, function(err,per){
        if (err) res.json(err);
        else res.json('Successfully removed');
    })
 })
chatRoutes.route('/getDefaultAnswer').post(async function(req,res){
  let stringquery = await Training.find({question:{$regex: new RegExp('^' + req.body.question, 'i')}});
  if (stringquery.length===1 && stringquery[0].question.toLowerCase() === req.body.question.toLowerCase()){
    
    return res.json({answer:stringquery[0].answer,default_answer:stringquery[0].default_answer});
  }
  let sametype = await Training.find({intent:req.body.intent,params:req.body.params})
  if (sametype.length>0){
    return res.json({answer:"",default_answer:sametype[0].default_answer})
  }
  else{
    return res.json({answer:"",default_answer:""})
  }
})
chatRoutes.route('/tss').get(async function(req,res){
  let wk= new wit();
  wk.updateEntity("temptest","temptest1");
  //let arrayEntities = await wk.infoEntity('intent');
  //console.log(arrayEntities);
  /*let entities = await wk.entities();
  entities = entities.filter(item=>!item.includes('wit'));
  let otherentities =[];
  for (let item of entities){
    let temp = await wk.infoEntity(item);
    otherentities.push(temp);
  }
  otherentities = otherentities.map(item=>{return {name: item.name, doc: item.doc,value:item.value}})
  //let otherentities = await entities.map(item=>{return await wk.infoEntity(item)});
  console.log(otherentities);*/
  res.json("arrayEntities");
})
chatRoutes.route('/listEntity').get(async function(req,res){
  let getwit = new wit();
  let entities = await getwit.entities();
  let intent = await getwit.infoEntity('intent');
  let otherentities =[];
  //otherentities = otherentities.map(item=>{return {name: item.name, doc: item.doc,value:item.value}})
  res.json({
    entities:entities.filter(item=>!item.includes('wit')).map(item=>{return item.charAt(0).toUpperCase() + item.slice(1)}).sort(),
    intent:intent.values.map(item=>{return item.value}).sort(),
    //other:otherentities
  });
})
chatRoutes.route('/findSameTraining').post(async function(req,res){
    let resp;
    let witRes ;
    let stringquery = await Training.find({question:{$regex: new RegExp('^' + req.body.question, 'i')}});
    
    if (stringquery.length===1 && stringquery[0].question.toLowerCase() === req.body.question.toLowerCase()){
      stringquery[0].flag = true;
      return res.json(stringquery[0]);
    }

    await client.message(req.body.question).then(r=>witRes = r);
    
    let listEntity =[];
    if (Object.keys(witRes.entities).length===0){
      return res.json({error:"Co loi xay ra"});
    }
    Object.keys(witRes.entities).forEach(function(key, idx) {
      if(key !== "intent"){
        listEntity.push(key);
      }
    }); 
    let params = listEntity.sort().join(',');
    let dbquerry = await Training.find({intent: witRes.entities.hasOwnProperty('intent')?witRes.entities.intent[0].value:"",params:params});
    let listAnswer = JSON.parse(JSON.stringify(dbquerry));
    if (dbquerry.length>0){
      if(params.length>0){
       for (let item of listEntity){
          listAnswer = listAnswer.filter(entity=>entity.entities[item].sort().join(',').toLowerCase()===witRes.entities[item].map(i=>{return i.value}).sort().join(',').toLowerCase())
       }
        if(listAnswer.length>1){ 
          return res.json(listAnswer[0]);
        }
        else if(listAnswer.length===1){
          return res.json(listAnswer[0]);
        }
        else{
          let out = dbquerry[0];
          out.params ="";
          return res.json(out);
        }  
   
        }
      else{
        let out = dbquerry[0];
          out.params ="";
        return res.json(out); 
       
      }
    }else{
      return res.json({error:"Co loi xay ra"});
     
    }
})
chatRoutes.route('/updateEntities/:id').post(async function(req,res){
    let getwit = new wit();
    let ans = await getwit.updateEntity(req.body.name.toLowerCase(),req.params.id);
    return res.json(ans?'Cập nhật thành công.':'Cập nhật thất bại.')

})
chatRoutes.route('/deleteEntities/:id').get(async function(req,res){
  let getwit = new wit();
  let ans = await getwit.deleteEntity(req.params.id);
  return res.json(ans?'Cập nhật thành công.':'Cập nhật thất bại.')

})


chatRoutes.route('/addEntities/').post(async function(req,res){
  let getwit = new wit();
  let ans = await getwit.createEntity(req.body.id);
  return res.json(ans?'Thêm entity thành công.':'Thêm entity thất bại.');

})

chatRoutes.route('/addIntent/').post(async function(req,res){
  let getwit = new wit();
  let ans = await getwit.createIntent(req.body.id);
  return res.json(ans?`Thêm intent ${req.body.id} thành công.`:`Thêm intent ${req.body.id} thất bại.`)

})

chatRoutes.route('/updateIntent/:id').post(async function(req,res){
  let checkDB = await Training.find({intent:{$regex: new RegExp('^' + req.params.id, 'i')}});
  if(checkDB.length > 0){
    return res.json(`Không thể cập nhật intent ${req.params.id} do intent này đang được sử dụng.`);
  }
  else{
    let getwit = new wit();
    let ans = await getwit.updateIntent(req.body.name,req.params.id);
    return res.json(ans?`Cập nhật intent ${req.params.id} -> ${req.body.name} thành công.`:`Cập nhật intent ${req.params.id} thất bại.`);
  }
})
chatRoutes.route('/deleteIntent/:id').get(async function(req,res){
  let checkDB = await Training.find({intent:{$regex: new RegExp('^' + req.params.id, 'i')}});
  if(checkDB.length > 0){
    return res.json(`Không thể xoá intent ${req.params.id} do intent này đang được sử dụng.`);
  }
  else{
    let getwit = new wit();
    let ans = await getwit.deleteIntent(req.params.id);
    return res.json(ans?`Xóa intent ${req.params.id}  thành công.`:`Xóa intent ${req.params.id} thất bại.`);
  }
})

chatRoutes.route('/getQuestion/').get(async function(req,res){
  Training.find(function(err,trains){
    if(err){
      res.json("Có lỗi xảy ra với database");
    }
    else{
      res.json(trains);
    }
  });

})

chatRoutes.route('/deleteQuestion/:id').post(async function(req,res){
  let getwit = new wit();
  let ans = await getwit.deleteQuestion(req.body.name);
  if(ans){
  Training.findByIdAndRemove(req.params.id,function(err,trains){
    if(err){
      res.json("Có lỗi xảy ra với database");
    }
    else{
      res.json(`Đã xóa thành công câu hỏi '${req.body.name}'`);
    }
  });}
  else{
    res.json("Có lỗi xảy ra với server Wit.ai");
  }

})

chatRoutes.route('/webhook').get(function(req, res) {
  if (req.query['hub.verify_token'] === 'Son!13879428') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

chatRoutes.route('/webhook').post(async function(req, res) {
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      if (message.message) {
        // If user send text
        if (message.message.text) {
          var text = message.message.text;

          let tempres = await getResFromWit(text);
          sendMessage(senderId, tempres);
        }
      }
    }
  }

  res.status(200).send("OK");
});

function sendMessage(senderId, message) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.FB_TOKEN , //"EAAGvgiCMDAsBAII22Ub9d6fZC16GmKZApCxy3Y6UhN3iDrcEFo6atMrXtSvqUPtnGzcJ4Ai5UsHIH5gduJjAJrVTEjlUOmOsjevSpRbu5dXilNrVuZBkelnXzW5uVfmCtqQTjrTc5iMTBejnE727UiPXL2EceZCxPRwTpAi8Bk1SCbetIaSD4qihRwysMBUZD",
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: {
        text: message
      },
    }
  });
}
module.exports = chatRoutes;