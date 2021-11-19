const express  = require("express") ;
const path     = require("path") ;
const session      = require("express-session") ;
const cookieParser = require("cookie-parser") ;
const bodyParser   = require("body-parser") ;

const monk     = require("monk") ;
const db       = monk("localhost/rays_edu") ;
const students = db.get("students") ;
const videos   = db.get("videos")
const folders  = db.get("folders") ;

const app = express()
const PORT = 3000
app.set("view engine" , "ejs")

app.use( express.json() )
app.use( session({
    secret : "skas2o38gq2uuvaog9" ,
    resave : false ,
    saveUninitialized : false ,
    cookie : {
        expires : 600000 
    }
})) ;
app.use(express.urlencoded({ extended: true }));
app.use( cookieParser()) ;
app.use( express.static("public") )

global.__basedir = __dirname

app.use("/admin"  , require("./routes/admin.js") )
app.use("/content"   , require("./routes/contents.js") )
app.use("/learn/test", require("./routes/exams.js")    )


app.get("/login", ( req, res ) => {
        if( req.session.username ){
            return res.redirect("/learn")
        }
        res.render( "login" , { url : "/login", method : "LOGIN"})
    })
    .get("/register", ( req, res ) => {
        if( req.session.username ){
            return res.redirect("/learn")
        }
        res.render("login", { url : "/register", method : "REGISTER"})
    })
    .post("/login", async ( req, res) => {
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
            
        setSession( req, name, found._id, false)

        res.json({
            msg : "logged in",
            redirect : "/learn"
        })
    })
    .post("/register", async ( req, res) => {
        const [found] = await findUser( req.body.username )

        if( found){
            return res.json({
                msg : "user already exist login" , 
                redirect : "/login"
            })
        }
        try{
            const inserted = await students.insert({
                name : req.body.username,
                password : req.body.password,
                batch : "PH07",
                course_code : 1,
                exams : {}
            })

            setSession( req, req.body.username, inserted._id, false)

            res.json({
                msg : "registered successfully !",
                redirect : "/learn"
            })
        }catch{
            res.json({
                msg : "something went wrong on our side",
                redirect : false
            })
        }
    })


app.get("/*", async ( req, res, next ) => {
    if( req.session.username ){
        req.user = await findUser( req.session.username )
        next()
    }else{
        res.redirect("/login")
    }
})

app.get("/", ( req, res ) => {
        return res.redirect("/learn")
    })
    .get("/learn", async ( req, res) => {
        const courses = await folders.find({ course: true })
        return res.render("index", { learn : true , courses })
    })
    .get("/learn/watch/:id", async ( req, res ) => {
        const id = req.params.id
        const [video] = await videos.find({id})

        if( video ){
            const params = {
                title : video.title ,
                id,
                uploaded : video.uploaded_on,
                comments : video.comments,
            }
            return res.render("watch", params )
        }
        res.send("file not found ")
    })
    .get("/chapters", async ( req, res) => {
        res.render("index", { learn : false })
    })
    .get("/chapters/*", async ( req, res) => {
        return res.render("index", { learn : false })
    })
    .get("/logout", ( req, res ) => {
        req.session.destroy()
        res.redirect("/login")
    })

app.listen( PORT , function(){
    console.log("server running on localhost port :  " + PORT )
})

async function findUser( name ){
    const found = await students.find( { name })
    return found 
}

function setSession( req, username, id, isadmin){
    req.session.username = username 
    req.session._id = id 
    req.session.isadmin = isadmin 
}