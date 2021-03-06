const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();
const PORT = process.env.PORT;
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./DB.js');
const chatRoute = require('./route/chat.route');

app.use(express.static("public"));
mongoose.Promise = global.Promise;
mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database'+ err)}
);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/traininglist', chatRoute);

app.listen(PORT, function(){
    console.log('Server is running on Port:',PORT);
});