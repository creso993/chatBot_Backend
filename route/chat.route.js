const express = require('express');
const chatRoutes = express.Router();
const wit = require('../model/Wit');
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
  console.log("hello");
  let witRes ;
  let stringquery = await Training.find({question:{$regex: new RegExp('^' + data, 'i')}});
  
  if (stringquery.length===1 && stringquery[0].question.toLowerCase() === data.toLowerCase()){
    console.log(stringquery);
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
    console.log(dbquerry);
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
        console.log([{
          "entity":"intent",
          "value":object.intent
        },
          ...tempentity
        ]);
        let sende = new wit();
        confirm = await sende.trainingQuestion(object.question,[{
          "entity":"intent",
          "value":object.intent
        },
          ...tempentity
        ])
        console.log(confirm);
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
    console.log(req.params.id);
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
  console.log('string querrrrrryyy');
    console.log(stringquery);
    
  if (stringquery.length===1 && stringquery[0].question.toLowerCase() === req.body.question.toLowerCase()){
    
    return res.json({answer:stringquery[0].answer,default_answer:stringquery[0].default_answer});
  }
  let sametype = await Training.find({intent:req.body.intent,params:req.body.params})
  console.log("get default answer");
  console.log(sametype)
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
    entities:entities.filter(item=>!item.includes('wit')).map(item=>{return item.charAt(0).toUpperCase() + item.slice(1)}),
    intent:intent.values.map(item=>{return item.value}),
    //other:otherentities
  });
})
chatRoutes.route('/findSameTraining').post(async function(req,res){
    console.log(req);
    let resp;
    let witRes ;
    let stringquery = await Training.find({question:{$regex: new RegExp('^' + req.body.question, 'i')}});
    
    if (stringquery.length===1 && stringquery[0].question.toLowerCase() === req.body.question.toLowerCase()){
      console.log(stringquery);
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
    let params = listEntity.join(',');
    let dbquerry = await Training.find({intent: witRes.entities.hasOwnProperty('intent')?witRes.entities.intent[0].value:"",params:params});
    let listAnswer = JSON.parse(JSON.stringify(dbquerry));
    if (dbquerry.length>0){
      console.log(dbquerry);
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
    console.log(req);
    let ans = await getwit.updateEntity(req.body.name.toLowerCase(),req.params.id);
    return res.json(ans?'Cập nhật thành công.':'Cập nhật thất bại.')

})
chatRoutes.route('/deleteEntities/:id').get(async function(req,res){
  let getwit = new wit();
  console.log(req.params.id);
  let ans = await getwit.deleteEntity(req.params.id);
  return res.json(ans?'Cập nhật thành công.':'Cập nhật thất bại.')

})
module.exports = chatRoutes;