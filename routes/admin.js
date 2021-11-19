const express = require("express")

const router = express.Router()

const monk     = require("monk") ;
const db       = monk("localhost/rays_edu") ;
const teachers = db.get("teachers") ;

router
    .get("/login",( req, res) => {
        if( req.session.username && req.session.isadmin){
            return res.redirect("/admin/home")
        }
        res.render("login",{ url : "/admin/login", method : "LOGIN"})
    })
    .get("/register",( req, res) => {
        if( req.session.username && req.session.isadmin){
            return res.redirect("/admin/home")
        }
        res.render("login",{ url : "/admin/login", method : "REGISTER"})
    })
    .post("/login", async ( req, res ) => {
        const name = req.body.username
        const password = req.body.password

        const [found] = await findUser( name )

        if( ! found ){
            return res.json( {
                msg : "invalid username",
                redirect : false,
            })
        }

        if( found.password !== password ){
            return res.json( {
                msg : "invalid password",
                redirect : false
            })
        }
            
        setSession( req, name, found._id, true)

        res.json({
            msg : "logged in",
            redirect : "/admin/home"
        })
    })
    .post("/register", async ( req, res ) => {
        const [found] = await findUser( req.body.username )

        if( found ){
            return res.json({
                msg : "user already exist login" , 
                redirect : "/admin/login"
            })
        }
        try{
            const inserted = await teachers.insert({
                name : req.body.username,
                password : req.body.password,
                batch : "PH07 2021-22",
                course_code : 1,
                exams : {}
            })

            setSession( req, req.body.username, inserted._id, true)

            res.json({
                msg : "registered successfully !",
                redirect : "/admin/home"
            })
        }catch{
            res.json({
                msg : "something went wrong on our side",
                redirect : false
            })
        }
    })
    .get("/*", ( req, res, next ) => {
        if( req.session.isadmin ){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .get("/", (req, res) => {
        res.redirect("/admin/login")
    })
    .get("/home", async ( req, res) => {
        const teacher = await findUser( req.session.username )

        const params = {
            name : "404",
            batch: "404",
            dp   : "/uploads/default.png"
        }
        if( teacher.length != 0){
            params.name  = teacher[0].name
            params.batch = teacher[0].batch
        }
        return res.render("admin", params )
    })
    .get("/logout", ( req, res) => {
        req.session.destroy()
        res.redirect("/admin/login")
    })


module.exports = router

async function findUser( name ){
    const found = await teachers.find( { name })
    return found 
}

function setSession( req, username, id, isadmin){
    req.session.username = username 
    req.session._id = id 
    req.session.isadmin = isadmin 
}