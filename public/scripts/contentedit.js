const app = document.getElementById("app")
const options = $(".options")

var pathname = window.location.pathname

if( pathname.slice(-1) == "/"){
    pathname = pathname.slice(0,-1)
}

var folders = {}

if( ! home ){
    load()
};


function load( id ){
    folders = {}
    warn("loading ...")

    const URL = "/content/get/all"
    if( id ){
        const URL = `/content/get/${id}`
    }

    $.get( URL , function( data ){
        for( let folder of data ){
            folders[folder.id] = folder
        }
        loadCurrent()
        unwarn()
    })
}
function loadCurrent(){
    pathname = window.location.pathname
    const id = pathname.replace("/content/edit/", "")

    if( folders[id] ){

        const folder = folders[id]
        $(app).empty()
        .append( $(`<div class='title'><img src="${folder.icon}""><h3>${folder.title}</h3></div>`) )

        renderVideos( folder )
        renderFolders( folder )
        renderFiles( folder )
        renderExams( folder )

        $(".folder").click( function( e ){
            e.preventDefault()
            const url = $(this).attr("href")
            history.pushState( null, null, url )
            loadCurrent()
        })

    }else{
        warn("404 trying again",3000)
        $.get(`/content/get/${id}`, function( data ){
            for( const folder of data ){
                folders[folder.id] = folder
            }
            loadCurrent()
        })
    }
}

function renderFolders( dir ){
    const addFolder = $("<div class='add-folder folder'><img src='/icons/folder-plus.svg'><p class='name'>add Folder</p></div>")
                .click( function(){
                    warn("adding...")
                    $.get(pathname + "/add", function( data ){
                        load()
                        warn( data , 4000)
                    })
                })
                
    const section = $("<section></section>")
    const title   = $("<div class='side-title'><h3>FOLDERS</h3><div>")
    const body    = $("<div class='body'></div>")

    for( const folderId of dir.folders ){
        const folder = folders[folderId]
        if( folder ){
            const folderElement = newFolderElement( folder.id, folder.icon, folder.title )
            body.append( folderElement )
        }
    }
    body.append( addFolder )

    section.append( title, body )
    $(app).append( section )
}
function renderFiles( dir ){
    const addFile = $("<div class='add-folder folder'><img src='/icons/file-upload.svg'><p class='name'>Upload File</p></div>")
            .click( function(){
                uploader("", function(file){
                    warn("adding...")

                    const data = new FormData()
                    data.enctype = "multipart/form-data"
                    data.set('file', file )

                    fetch( pathname + "/add/file", {
                        method : "POST",
                        body : data 
                    })
                    .then( function( res ){
                        warn( "uploaded", 4000 )
                    })
                    .catch( function( res ){
                        warn( "failed", 4000 )
                    })
                })
                
            })
    const section = $("<section></section>")
    const title   = $("<div class='side-title'><h3>ATTACHMENTS</h3><div>")
    const body    = $("<div class='body'></div>")
    
    for( const fileId of dir.files ){
        const file = folders[fileId]
        if( file ){
            const fileElement = newFileElement( file.id, file.icon, file.title)
            body.append( fileElement )
        }
    }
    body.append( addFile )

    section.append( title, body )
    $(app).append( section )
}
function renderVideos( dir ){
    const uploadVideo = $("<div class='video'><img src='/icons/video.png'><p class='name'>upload video file</p></div>")
        .click( function(){
            
            uploader("video", function(file){
                warn("adding...")

                const data = new FormData()
                data.enctype = "multipart/form-data"
                data.set('file', file )

                fetch( pathname + "/add/video", {
                    method : "POST",
                    body : data 
                })
                .then( function( res ){
                    warn( "uploaded", 4000 )
                })
                .catch( function( res ){
                    warn( "failed", 4000 )
                })
            })
        })
    const section = $("<section></section>")
    const body    = $("<div class='body'></div>")

    if( dir.videos ){
        for( const videoId of dir.videos ){
            const videoFile = folders[videoId]
            if( videoFile ){
                const videoElement = newVideoElement( videoFile.id, videoFile.icon, videoFile.title)
                body.append( videoElement )
            }
        }
    }
    
    body.append( uploadVideo )

    section.append( body )
    $(app).append( section )  
}
function renderExams( dir ){
    const createXam = $("<div class='video'><img src='/icons/file-write.svg'><p class='name'>create Exam</p></div>")
        .click( function(){
            warn("creating...")
            $.get( pathname + "/add/exam", function( res ){
                warn( res , 4000)
                load()
            })
        })
    const section = $("<section></section>")
    const title   = $("<div class='side-title'><h3>Exams</h3><div>")
    const body    = $("<div class='body'></div>")

    if( dir.exams ){
        for( const examId of dir.exams ){
            const examFile = folders[examId]
            if( examFile ){
                const ExamElement = newExamElement( examFile.id, examFile.icon, examFile.title)
                body.append( ExamElement )
            }
        }
    }
    
    body.append( createXam )

    section.append( title, body )
    $(app).append( section )  
}


function newFolderElement( id, icon, title){
    const main = $(`<a href="/content/edit/${id}" class="folder"></a>`)
                .append( $(`<img src="${icon}">`))
                .append( $(`<p class="name">${title}</p>`))

    const menuIcon = $("<span class='icon'><img src='/icons/menu-dots.svg'></span>")
                    .click( function(){
                        openOptions( this , { id , title} , [] )
                    })
                    
    const more = $("<div class='more'></div>").append( menuIcon )
    return $("<div class='folder-wrap'></div>").append( main , more)
}
function newFileElement( id, icon, title){
    const fileImage = $(`<div class="file-img"></div>`)
    .append( $(`<img src="${icon}">`))

    const main = $(`<a href="/content/attachments/${id}" class="file"></a>`)
                .append( fileImage )
                .append( $(`<p class="name">${title}</p>`))

    const menuIcon = $("<span class='icon'><img src='/icons/menu-dots.svg'></span>")
                .click( function(){
                    openOptions( this , { id , title} , [] )
                })
                
    const more = $("<div class='more'></div>").append( menuIcon )
    return $("<div class='folder-wrap'></div>").append( main , more)
}
function newVideoElement( id, icon, title){
    const thumb = $(`<div class="video-thumbnail play"></div>`)

    const main = $(`<a href="/learn/watch/${id}" class="video"></a>`)
                .append( thumb )
                .append( $(`<p class="name">${title}</p>`))

    const menuIcon = $("<span class='icon'><img src='/icons/menu-dots.svg'></span>")
                .click( function(){
                    openOptions( this , { id , title}, [])
                })
                
    const more = $("<div class='more'></div>").append( menuIcon )
    return $("<div class='folder-wrap'></div>").append( main , more)
}
function newExamElement( id, icon, title){
    const fileImage = $(`<div class="file-img"></div>`)
    .append( $(`<img src="${icon}">`))

    const main = $(`<a href="/learn/test/${id}/edit" class="file"></a>`)
                .append( fileImage )
                .append( $(`<p class="name">${title}</p>`))

    const menuIcon = $("<span class='icon'><img src='/icons/menu-dots.svg'></span>")
                .click( function(){
                    openOptions( this, { id , title}, [] )
                })
                
    const more = $("<div class='more'></div>").append( menuIcon )
    return $("<div class='folder-wrap'></div>").append( main , more)
}


function openOptions( ele , data, deactive){
    const position = $(ele).offset()
    const width = $(ele).innerWidth()
                
    position.left += width 
    position.top -= window.scrollY
                
    if( position.left > window.innerWidth - 200){
        position.left -= 180 + width 
       }
    if( ! deactive ){ deactive = [] ;}

    options.find("li").off("click").on("click", closeOptions )

    options.find(".delete").on( "click", function(){ deleteF( data.id ) } )
    options.find(".rename").on( "click", function(){ renameF( data.id ) } )
    options.find(".change").on( "click", function(){ changeF( data.id ) } )

    options.find("li").show().filter( deactive.join(" , ") ).hide()

    $(".overlay").show()
    options.css({
        left : position.left ,
        top  : position.top ,
    })
    options.slideDown(100)
}
function closeOptions(){
    $(".overlay").hide()
    options.slideUp(100)
}

function deleteF( id ){
    const data = ""
    confirm("Are you sure u want to delete selected", function(){
        warn("deleting..")
        $.post(`/content/edit/${id}/delete`, { data }, function( res ){
            load()
            warn( res , 4000)
        })
    })
}
function renameF( id ){
    prompt("Enter new name for selected folder", "New Folder", function( data ){
        warn("renaming..")
        $.post(`/content/edit/${id}/rename`, { data }, function( res ){
            load( id )
            warn( res.msg , 2000)
        })
    })
}
function changeF( id ){
    library("/content/images/getall", function( filename ){
        return $(`<img src=/uploads/${filename}>`)
    }, function( url, element ){
        
        const data = {
            id : url,
            data : "/uploads/" + url ,
        }

        $.post(`/content/edit/${id}/icon`, data , function( res ){
            warn( res.msg , 4000)
            load( id )
        })
    }, function(){
        uploader("image", function( file ){
            if( ! file ) warn("please select a file") ;
            warn("uploading")
    
            const data = new FormData()
            data.enctype = "multipart/form-data"
            data.set('file', file )
            data.set('id', id )
    
            fetch("/content/images/upload", {
                method : "POST" ,
                body : data ,
            }).then( res => {
                console.log( res )
                warn("uploaded !",2000, function(){warn("please select again to set icon", 4000)})
            })
        })
    })
}




$(".overlay").click( function(){
    closeOptions()
    unconfirm()
    unprompt()
    abortLoader()
    abortLibrary()
})

window.addEventListener("popstate", loadCurrent )


