const env = process.env;
const dotenv = require('dotenv')
const express = require('express');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const { MongoClient } = require('mongodb');

const app = express();
dotenv.config()

DB_URL = `mongodb+srv://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}/${env.DB_NAME}?retryWrites=true&w=majority`
DB_OPTIONS = { 
    useNewUrlParser: true,
    useUnifiedTopology: true
}

// mongoose.connect(DB_URL, DB_OPTIONS, 
//     err => {
//         if (err){
//             console.log("Could not connect to the database")
//             console.log(err)
//         } else{
//             console.log(`Connected to ${process.env.DB_NAME}.`)
//         }
//     }
// )

// const mongoClient = new MongoClient(DB_URL)

async function getCounts(){
    const mongoClient = new MongoClient(DB_URL, DB_OPTIONS)
    await mongoClient.connect();
    const courses = await mongoClient.db('nu-reviews').collection('courses');
    const profs = await mongoClient.db('nu-reviews').collection('profs');
    const courseCount = await courses.countDocuments({});
    const profCount = await profs.countDocuments({});
    await mongoClient.close()
    return [courseCount, profCount]
}

async function getWebDev(){
    const mongoClient = new MongoClient(DB_URL, DB_OPTIONS)
    await mongoClient.connect();
    const courses = await mongoClient.db('nu-reviews').collection('courses');
    const webdev = await courses.find({course_name : 'Intro to Web Development, Special Topics in Computer Science(396-0-6)'}).toArray();
    await mongoClient.close()
    return webdev
    
}

app.get('/', function(req, res){
    res.status(200).send('App is running. Try GET /count or GET /webdev')
})

app.get('/count', function(req, res){
    getCounts().then(
        counts => {
            res.status(200).send('course count: ' + counts[0] + ' prof count: ' + counts[1])
        }
    )
})

app.get('/webdev', function(req,res){
    getWebDev().then(
        courses => {
            res.status(200).send(courses)
        }
    )
})

app.listen(8080)
console.log('Application listening on PORT: 8080')
console.log('http://localhost:8080')
