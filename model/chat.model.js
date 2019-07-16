const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define collection and schema for Business
let Chat = new Schema({
    entities: {
       
    },
   params: {
        type: String
    },
    intent: {
        type: String
    }
    ,
    question:{
        type:String
    },
    default_answer:{
        type:String
    },
    answer:{
        type:String
    }
},

{
    collection: 'Training'
});

module.exports = mongoose.model('Chat', Chat);