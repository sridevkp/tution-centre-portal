const express = require("express")
const path = require("path")
const fs   = require("fs")
const formidable = require("formidable")
const { v4: uuidv4 } = require("uuid");

const router = express.Router()

const monk     = require("monk") ;
const db       = monk("localhost/rays_edu") ;

const folders = db.get("folders") ;
const files   = db.get("files") ;
const videos  = db.get("videos");
const exams   = db.get("exams") ;


router.use("/*", ( req, res, next) => {
        if( ! req.session.username ) return res.redirect("/admin/login") ;
        next()
    })

router.get("/watch/:id", async ( req, res ) => {
        const id = req.params.id
        const range = req.headers.range ;
        if( ! range ){
            return res.redirect("/")
        }
        try{
            const video = await videos.findOne({ id })
            if( ! video ) return res.send("file not found") ;

            const videoPath = path.join( __basedir, "videos", video.path );
            const size = fs.statSync( videoPath ).size ;

            const chunkSize = 10 ** 6 ;
            const start = Number( range.replace(/\D/g,""))
            const end   = Math.min( start + chunkSize , size - 1) ;


            const contentLength = end - start + 1;
            const headers = {
                "Content-Range"   : "bytes " + start + "-" + end + "/" + size ,
                "Accept-Ranges"  : "bytes" ,
                "Content-Length" : contentLength ,
                "Content-Type"   : "video/mp4" 
            }
            res.writeHead(206 , headers) ;
            const videoStream = fs.createReadStream( videoPath , { start , end})
            videoStream.pipe( res )
        }catch{
            console.log("error occured watchin videos")
        }
    })
    .post("/watch/:id/comment", async ( req, res ) => {
        const id = req.params.id
        const msg = req.body 

        try{
            await videos.update({ id }, { $push: { comments :  msg } })
            res.send("commented")
        }catch(e){
            res.send("someething went wrong")
        }
    })

router.get("/get/:id", async ( req, res ) => {
        const id = req.params.id
        let found 

        if( id == "all"){
            found = await folders.find()
        }else{
            found = await folders.findOne({ id }) 
        }
        if( ! found ) return res.send("404")
        res.json( found )
    })
    .get("/getchild/:id", async ( req, res ) => {
        const found = await folders.find({ id : req.params.id }) 
        if( ! found  ) return res.send("404")

        res.json( folders )
    })
    .get("/attachments/:id", async ( req, res ) => {
        const file = await files.findOne({ id : req.params.id }) 
        if( ! file ){ res.send("404") }
        
        res.sendFile(path.join( __basedir, "docs", file.path ))
    })

    
router.use(["/edit/:id/*","/images/*"], ( req, res, next ) => {
        if( ! req.session.isadmin ) return res.send("unauthorized")
        next()
    })
    .use(["/edit/*","/edit"], ( req, res, next) => {
        if( ! req.session.isadmin ) return res.redirect("/admin/login")
        next()
    })
    

router.get("/edit", async ( req, res ) => {
        const courses = await folders.find({ course : true })
        return res.render("contentedit", { home : true , courses })
    })
    .get("/edit/:id", async ( req, res ) => {
        return res.render("contentedit", { home : false  })
    })
    .get("/edit/:id/add", async ( req, res ) => {
        const id = req.params.id
        const newId = generateId(8) 
        
        const folder = {
            title   : "New folder",
            icon    : "/uploads/folder.png",
            type    : "folder",
            parent  :  id,
            id      : newId ,
            files   : [],
            folders : [],
            videos  : [],
            exams   : [],
        }

        try{
            await folders.insert( folder )
            await folders.update({ id }, { $push: { folders :  newId } })
            res.send( "folder created" )
        }catch(e){
            res.send( "something went wrong" )
        }
        
    })
    .get("/edit/:id/add/exam", async ( req, res ) => {
        const id = req.params.id
        const newId = generateId()

        const title = "exam-" + new Date().toDateString()
        const examFolder = {
            title : title,
            id    : newId ,
            type  : "exam",
            icon  : "/uploads/examicon.png"
        }
        const exam = {
            title : title,
            id    : newId ,
            available : {
                from : new Date() ,
                to   : new Date( new Date().getTime() + 60 * 60 * 1000),
            },
            duration  : 60,
            passMarks : 10,
            attempted : 0 ,
            questions : [],
            answers   : [],
            comments  : [],
            marks     : {
                correct : 4,
                wrong   : -1
            },
            trophies  : null,
        }
        try{
            await folders.insert( examFolder )
            await folders.update({ id }, { $push: { exams :  newId } })
            await exams.insert( exam )
            res.send( "exam created" )
        }
        catch(e){
            res.send( "something went wrong" )
        } 
    })
    .post("/edit/:id/add/file", ( req, res ) => {
        const id = req.params.id
        const newId = generateId(8) 
        
        const uploadFolder = path.join( __basedir, "docs")

        const formData = new formidable.IncomingForm()
        formData.maxFileSize = 1000 * 1024 * 1024
        formData.uploadDir = uploadFolder

        formData.parse( req, async ( err, fields, body ) => {
            const docFile = body.file
            const oldFilePath = docFile.path 
            const newPath = uploadFolder + "/" + docFile.name 

            fs.rename( oldFilePath, newPath, (err) => {
                console.log( err )
            })

            const fileFolder = {
                title : "file-" + new Date().toUTCString(),
                icon  : "/uploads/fileicon.png",
                type  : "file",
                content_type : "pdf",
                id    : newId ,
                parent: id, 
            }
    
            const file = {
                id : newId,
                path : docFile.name,
            }
    
            try{
                await files.insert( file )
                await folders.insert( fileFolder )
                await folders.update({ id }, { $push: { files :  newId } })
                res.send("file uploaded" )
            }
            catch(e){
                console.log(e)
                res.send( "something went wrong")
            }
        })

        
    })
    .post("/edit/:id/add/video", ( req, res ) => {
        const id = req.params.id
        const newId = generateId(8) 
        const uploadFolder = path.join( __basedir, "videos")

        const formData = new formidable.IncomingForm()
        formData.maxFileSize = 1000 * 1024 * 1024
        formData.uploadDir = uploadFolder

        formData.parse( req, async ( err, fields, body ) => {
            const vidFile = body.file
            const oldFilePath = vidFile.path 
            const newPath = uploadFolder + "/" + vidFile.name 

            fs.rename( oldFilePath, newPath, (err) => {
                console.log( err )
            })

            const title = "video-" + new Date().toISOString() + ".mp4"

            const fileFolder = {
                title  : title,
                type   : "video",
                id     : newId ,
                parent : id, 
            }
    
            const video = {
                title       : title,
                id          : newId,
                path        : vidFile.name,
                uploaded_on : new Date(),
                comments    : []
            }
    
            try{
                await videos.insert( video )
                await folders.insert( fileFolder )
                await folders.update({ id }, { $push: { videos :  newId } })
                res.send( "video uploaded" )
            }
            catch(e){
                console.log(e)
                res.send( "something went wrong" )
            }
        })
    })
    .post("/edit/:id/:method", async ( req, res) => {
        const id     = req.params.id
        const method = req.params.method 

        const data = req.body.data 

        if( method == "rename"){
            folders.update({ id }, {$set : { title : data }})
            return res.send("renamed")
        }
        if( method == "delete"){
            const folder = await folders.findOne({ id })
            if( folder ){
                //removing from parent
                folders.update({ id : folder.parent } ,
                    { $pull : { folders : id }})
                
                folders.update({ id : folder.parent } ,
                    { $pull : { files : id }})

                folders.update({ id : folder.parent } ,
                    { $pull : { videos : id }})
            }

            await deleteDoc( id ) ;

            return res.send("deleted")
        }
        if( method == "icon"){
            folders.update({ id }, {$set : { icon : data }})
            return res.send("icon changed")
        }
    })
    .post("/images/upload" , ( req, res ) => {
        const uploadFolder = path.join( __basedir, "public","uploads")

        const formData = new formidable.IncomingForm()
        formData.maxFileSize = 1000 * 1024 * 1024
        formData.uploadDir = uploadFolder

        formData.parse( req, ( err, fields, files ) => {
            const oldFilePath = files.file.path 
            const newPath = uploadFolder + "/" + files.file.name 

            fs.rename( oldFilePath, newPath, err => {
                console.log( err )
            })
        })

        res.send( "success" )
    })
    .get("/images/getall", ( req, res) => {
        const dir = path.join( __basedir, "public/uploads")
        fs.readdir(dir, function( err, files ){
            res.json( files )
        })
    })



module.exports = router

async function deleteDoc( id , d = 5){
    if( d == 0 ) return ;
    try{
        const doc = await folders.findOne({ id })
        if( ! doc ) return 

        if( doc.folders ){
            for(const folderId of doc[0].folders){
                deleteDoc( folderId, d - 1)
            }
        }
        if( doc.files ){
            for(const fileId of doc[0].files){
                deleteDoc( fileId, d - 1)
            }
        }
        if( doc.videos ){
            for(const videoId of doc[0].videos){
                deleteDoc( videoId, d - 1)
            }
        }
        if( doc.exams ){
            for(const  examId of doc[0].exams){
                deleteDoc( examId , d - 1)
            }
        }
        folders.remove({ id })
        videos.remove({ id })
        files.remove({ id })
        exams.remove({ id })
    }catch{

    }
    
}

function generateId( l = 8 ){
    let id = ""
    for( let i = 0 ; i< l ; i++ ){
        id += uuidv4()[i]
    }
    return id
}
