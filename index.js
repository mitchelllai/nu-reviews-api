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

app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE");
    next();
})

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

//TESTING FUNCTIONS AND ROUTES
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

//REAL API ROUTES
const SCHOOL_DICT = {
    'Bienen' : 'Bienen School of Music',
    'Communication' : 'School of Communication',
    'McCormick' : 'McCormick School of Engineering and Applied Science',
    'Medill' : 'Medill School of Journalism',
    'SESP' : 'School of Educ & Social Policy',
    'Weinberg' : 'Weinberg College of Arts and Sciences'
}
async function getCourses(keyword, schools, quarters){
    const mongoClient = new MongoClient(DB_URL, DB_OPTIONS)
    await mongoClient.connect();
    const courses = await mongoClient.db('nu-reviews').collection('courses-test-2');
    let matches = [];
    let schools_formatted;

    if (schools.length === 0){
        schools_formatted = [
                    'Bienen School of Music', 
                    'School of Communication',
                    'McCormick School of Engineering and Applied Science',
                    'Medill School of Journalism',
                    'School of Educ & Social Policy',
                    'Weinberg College of Arts and Sciences'
                ]
    }
    else{
        // console.log(typeof schools)
        schools_formatted = schools.map(school => SCHOOL_DICT[school])
    }

    if(quarters.length === 0){
        quarters = ['2021 Spring', '2021 Winter', '2020 Fall']
    }

    // console.log(schools_formatted)
    // console.log(quarters)

    let match = await courses.find({
        quarter: {$in: quarters},
        school: {$in: schools_formatted},
        course_id: {$regex: keyword, $options: 'i'},
            // $or: [
            //     {subject_code: {$regex: word, $options: 'i'}},
            //     {course_number: {$regex: word, $options: 'i'}},
            //     {instructor: {$regex: word, $options: 'i'}},
            //     {course_name: {$regex: word, $options: 'i'}},
            // ]
        }).toArray()
    Array.prototype.push.apply(matches, match)
    matches = new Set(matches)
    await mongoClient.close()
    return Array.from(matches)
}
app.get('/courses', function(req, res){
    let keyword = req.query.key;
    let quarters = JSON.parse(req.query.quarters);
    let schools = JSON.parse(req.query.schools);
    // console.log(quarters)
    // console.log(schools)
    getCourses(keyword, schools, quarters).then(
        matches => {
            // console.log(matches)
            res.status(200).send(matches)
        }
    )
})

PORT = process.env.PORT || 8080

app.listen(PORT)
console.log(`Application listening on PORT: ${PORT}`)
console.log(`http://localhost:${PORT}`)
