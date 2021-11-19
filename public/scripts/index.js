const icon = {
    empty  : "fi-rr-minus-small" ,
    folder : "fi-rr-caret-right",
    file   : "fi-rr-clip",
    exam   : "fi-rr-document",
    video  : "fi-rr-play"
}
const url = {
    folder : ( id ) => { return "/chapters/" + id } ,
    file   : ( id ) => { return "/content/attachments/" + id } ,
    video  : ( id ) => { return "/learn/watch/" + id },
    exam   : ( id ) => { return "/learn/test/" + id }
}

const app = document.getElementById("app")
var pathname = window.location.pathname

if( pathname.slice(-1) == "/"){
    pathname = pathname.slice(0,-1)
}
unwarn()

var folders = {}

if( ! learn ){
    load()
};

function load( cb ){
    warn("loading")
    $.get('/content/get/all', function( data ){
        unwarn()
        for( let folder of data ){
            folders[folder.id] = folder
        }
        createContentNav()
        loadCurrent()
    })
}

function loadCurrent(){
    pathname = window.location.pathname
    const id = pathname.replace("/chapters/", "")

    if( folders[id] ){
        const folder = folders[id]

        $(app).empty()
        .append( $(`<div class='title'><img src="${folder.icon}""><h3>${folder.title}</h3></div>`))

        renderVideos( folder )
        renderFolders( folder )
        renderExams( folder )
        renderFiles( folder )

        $(".folder").click( function ( e ){
            start( $(this).attr("href"), e)
        } )

    }else{
        warn("loading")
        $.get(`/content/get/${id}`, function( data ){
            for( const folder of data ){
                folders[folder.id] = folder
            }
            unwarn()
        })
    }
}



function createContentNav(){
    const parents = Object.values(folders).filter( ele => { return ele.parent === "0"} ) 

    const root = $("<ul class='nav'></ul>")

    for( let folder of parents ){
        root.append( navLink( folder , true))
    }

    $(".content-nav-body").empty()
    .append( root )
}

function navLink( doc , root){
    if( ! doc ) return ;

    const li     = $("<li></li>") ;
    const a      = $("<a href='/chapters/" + doc.id +"' class='nav'>"+doc.title+"</a>")
    const expand = $("<span class='fi "+(icon[doc.type] || icon.folder )+"'>")

    if( url[doc.type] ) a.attr("href", url[doc.type]( doc.id ) )

    const navFolder = $("<div class='nav-folder'>")
    .append( expand )
    .append( a ) ;
    
    if( root ) navFolder.addClass("root") ;
    if( doc.type && doc.type !== "folder" ){
        navFolder.addClass("content") 
    };

    li.append( navFolder )

    const ul = $("<ul class='nav'></ul>");

    ["videos","files","exams","folders"].forEach( function( key, index ){
        if( ! doc[key] ) return ;

        for( let childId of doc[ key ] ){
            ul.append( navLink( folders[ childId ] , false) )
        }
    })
    if( ul.children().length > 0){
        ul.slideUp(0)
        li.append( ul )

        expand.click( function( e ){
            e.preventDefault()
            $(this).toggleClass("rotate")
            ul.slideToggle(200,"swing")
        })

    }else{
        if( ! doc.type || doc.type == "folder") {
            navFolder.children("span").removeClass().addClass("fi " + icon.empty) ;
        }
    }

    if( ! doc.type || doc.type == "folder" ){
        a.click(function(e){
            start( $(this).attr("href"), e)
        })
    }
    return li
}

window.addEventListener("popstate", loadCurrent )

function renderFolders( dir ){
    const section = $("<section></section>")
    const body    = $("<div class='body'></div>")

    for( const folderId of dir.folders ){
        const folder = folders[folderId]
        if( folder ){
            const folderElement = $(`<a href="/chapters/${folder.id}" class="folder"><img src="${folder.icon}"><p class="name">${folder.title}</p></a>`)
            body.append( folderElement )
        }
    }

    section.append( body )
    $(app).append( section )
}

function renderFiles( dir ){
    const section = $("<section></section>")
    const title   = $("<div class='side-title'><h3>ATTACHMENTS</h3><div>")
    const body    = $("<div class='body'></div>")
    
    for( const fileId of dir.files ){
        const file = folders[fileId]
        if( file ){
            const fileElement = $(`<a href="/content/attachments/${file.id}" class="file"><div class="file-img"><img src="${file.icon}"></div><p class="name">${file.title}</p></a>`)
            body.append( fileElement )
        }
        
    }

    if( dir.files.length == 0){
        title.html("<h3>no ATTACHMENTS</h3>")
    }

    section.append( title, body )
    $(app).append( section )
}

function renderVideos( dir ){
    if( ! dir.videos || dir.videos.length == 0 ) return ;

    const section = $("<section></section>")
    const body    = $("<div class='body'></div>")

    for( const videoId of dir.videos ){
        const folder = folders[videoId]
        if( folder ){
            const videoElement = $(`<a href="/learn/watch/${folder.id}" class="video"><div class="video-thumbnail play"></div><p class="name">${folder.title}</p></a>`)
            body.append( videoElement )
        }
    }

    section.append( body )
    $(app).append( section )
}

function renderExams( dir ){
    if( ! dir.exams || dir.exams.length == 0 ) return ;

    const section = $("<section></section>")
    const body    = $("<div class='body'></div>")

    for( const examId of dir.exams ){
        const examFile = folders[examId]
        if( examFile ){
            const ExamElement = $(`<a href="/learn/test/${examFile.id}" class="file"><div class="file-img"><img src="${examFile.icon}"></div><p class="name">${examFile.title}</p></a>`)
            body.append( ExamElement )
        }
    }

    section.append(  body )
    $(app).append( section )  
}

function start( url, e ){
    if( e ) e.preventDefault() ;
    history.pushState( null, null, url )
    loadCurrent()
}


