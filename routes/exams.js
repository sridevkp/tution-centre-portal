const express = require("express")
const { v4: uuidv4 } = require("uuid");
const router = express.Router()

const monk     = require("monk") ;
const db       = monk("localhost/rays_edu") ;
const exams    = db.get("exams")
const teachers = db.get("teachers")
const students = db.get("students")


//students side verification student
router.use("/:id/*", auth)

router.get("/:id", auth, async ( req, res ) => {
        const id = req.params.id 
        const xam = req.xam
        const user = req.user

        let result ;
        if( user.exams[id] ){
            result = user.exams[id]
        }
        return res.render("preview-test", {xam, result} )
        
    })
    .get("/:id/attempt", async ( req, res ) => {
        const id = req.params.id 
        const xam = req.xam
        const user = req.user
        
        let userdata = {}
        const startTime = new Date( xam.available.from )
        const endTime   = new Date( xam.available.to )

        if( endTime < new Date() || startTime > new Date() ){
            return res.redirect(`/learn/test/${id}/`)
        }
        delete xam.answers
        if( user.exams[id] ){
            userdata = user.exams[id]
        }
        return res.render("write-test", { xam , json : JSON.stringify(xam), userdata})
    })
    .get("/:id/load", async ( req, res ) => {
        const id = req.params.id 
        const xam = req.xam

        if( req.query.ans ){
            return res.json({ q : xam.questions, a : xam.answers })
        }
        res.json({ q : xam.questions })
        
    })
    .post("/:id/save", async ( req, res ) => {
        const id = req.params.id
        const user = req.user
        const exam = req.xam

        if( user.exams[id] && user.exams[id].state == "submit"){ 
            return res.send("cant save")
        }

        try{
            const toSave = {
                state     : "paused",
                timeLeft  : req.body.timeLeft ,
                answers   : req.body.answers || [],
            }
            let exams = user.exams 
            if( user.exams[ id ] && user.exams[ id ].startedAt ){
                toSave = user.exams[ id ].startedAt
            }
            exams[ id ] = toSave 

            students.update({ _id : req.session._id }, {
                    $set : { exams }
            })
            res.send("saved")
        }catch{
            res.send("something went wrong")
        }
    })
    .post("/:id/end", async ( req, res ) => {
        const id = req.params.id 
        const exam = req.xam
        const user = req.user

        if( !(exam && user && user.exams[id]) ){ return res.send("unauthorized")}
        const userresponse = user.exams[id]

        try{
            const correct = userresponse.answers.filter(( e, i ) => { return e == exam.answers[i]}).length
            const wrong   = userresponse.answers.filter(( e, i ) => { return e != exam.answers[i] && e !== "" }).length
            const unattempted = userresponse.answers.filter(( e, i ) => { return e === "" }).length
            const marks = correct * exam.marks.correct + wrong * exam.marks.wrong
            
            const toSave = {
                state : "submit",
                correct ,
                wrong   ,
                marks   ,
                unattempted,
                date : new Date(),
                answers : userresponse.answers,
                timeTaken : exam.duration - userresponse.timeLeft ,
                pass      : marks >= exam.passMarks,
                percentage: correct / exam.questions.length * 100,
                rank      : "NA",
            }
            user.exams[ id ] = toSave

            students.update({ _id : req.session._id }, {
                $set : {  exams : user.exams }
            })
            res.send("saved")
        }catch{
            res.send("something went wrong")
        }
        
    })

//admins side verification teacher

router.get("/:id/edit", adminAuth ,async ( req, res ) => {
        const id = req.params.id
        const xam = req.xam

        if( xam ){
            const json = JSON.stringify(xam) 
            return res.render("edit-test", { xam, json } )
        }
        res.send("file not found")
    })
    .post("/:id/edit/save", adminAuth, async ( req, res ) => {
        const id = req.params.id;
        const data = req.body
        
        if( ! data ){ return res.send("something went wrong") }

        try{
            await exams.update({ id }, { $set : data })
            res.send("saved 👍🏻")
        }catch{
            res.send( "something went wrong !")
        }
    })

async function auth( req, res, next){
    if( req.session.username ){
        if( req.session.isadmin ){
            req.user = { exams : {}}
        }else{
            req.user = await students.findOne({ _id : req.session._id })
        }
        req.xam = await exams.findOne({ id : req.params.id })

        if( req.xam && req.user){
            next()
            return
        } 
        return res.send("404")
    }else{
        res.redirect("/login")
    }
}
async function adminAuth( req, res, next){
    if( ! req.session.username || ! req.session.isadmin ){
        return res.send("unauthorized, REPORTING")
    }
    next()
}

module.exports = router

