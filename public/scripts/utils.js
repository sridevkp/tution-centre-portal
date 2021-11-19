$(".thumbnail").on("dragover" , function(e){
    e.preventDefault()
    $(this).addClass("mouse-over") ;
}).on( "dragleave dragend" , function(e){
    e.preventDefault()
    $(this).removeClass("mouse-over") ;
})

function warn( msg , time, cb){
    $(".message").text( msg ).slideDown(100)
    if( time ){
        setTimeout( function(){
             unwarn(); 
             if( cb ) setTimeout( cb, 100 ) ;
        }, time)
    }
}
function unwarn(){ $(".message").slideUp(100) }


function confirm( txt, onyes, oncancel ){
    focus()

    $("#confirm").find(".txt").text( txt )
    $("#confirm").fadeIn(100)

    .find("#yes").off("click").on("click", function(){
        unconfirm()
        if( onyes ){
            onyes()
        }
    })
    $("#confirm").find("#cancel").off("click").on("click", function(){
        unconfirm()
        if( oncancel){
            oncancel()
        }
    })
}
function unconfirm(){
    unfocus()
    $("#confirm").hide()
}


function prompt(q , value,  onenter , oncancel ){
    const input = $("#prompt-input").focus( function(){ $(this).select() })
    
    focus()

    $("#prompt").find(".txt").text( q )
    input.val( value ) 

    $("#prompt").fadeIn(100)
    .find("#continue").off("click").on("click", function(){
        unprompt()
        if( onenter ){
            onenter( input.val() )
        }
    })
    
    input.get(0).focus()

    $("#prompt").find("#abort").off("click").on("click", function(){
        unprompt()
        if( oncancel ){
            oncancel()
        }
    })
}
function unprompt(){
    unfocus()
    $("#prompt").hide()
}


function uploader( type, cb ){
    var FILE ;
    focus()
    
    $("#file").attr("accept", type + "/*")
    .off("change")
    .on("change", function(){
        FILE  = this.files[0]
        updateThumb( this.files[0] )
    })

    if( type.substring(0,1) == "." ){
        $("#file").attr("accept", type )
    }

    $(".thumbnail").off("drop")
    .on("drop", function( e ){
        $(this).removeClass("mouse-over") ;
        if( e.dataTransfer && e.dataTransfer.files.length && e.dataTransfer.files.length > 0 ){
            $("#file").files = e.dataTransfer.files ;
            FILE = e.dataTransfer.files[0]
            updateThumb( e.dataTransfer.files[0] )
        }
    })
    
    $("#uploader").fadeIn(100)
    .find("#upload")
    .off("click")
    .on("click", function(){
        abortLoader()
        if( FILE ) cb( FILE ) ;
    })
}
function abortLoader(){
    unfocus()
    $("#uploader").hide()
}
function updateThumb( file ){
    $(".thumbnail").attr("data-label", file.name.substring(0,30))

    const reader = new FileReader() ;
    reader.readAsDataURL( file );
    reader.onload = () => {
        imageFile = reader.result
        $(".thumbnail").css("background-image", "url(" + imageFile + ")" )  ; 
    }
}

function focus(){
    $(".overlay").fadeIn(100)
}
function unfocus(){
    $(".overlay").hide()
}

function library( url, onload, onclick , oncustom){
    focus()
    const container = $(".library-container")
                        .empty()

    $.get( url, function( data ){
        data.forEach( function( item ){
            const element = onload( item ) 
            container.append( element )
            $(element).on("dblclick", function(){
                abortLibrary()
                onclick( item , element )
            } )
        })
    })

    $("#library-view").fadeIn(100)
    .find("#custom").off("click").click( abortLibrary ).click( oncustom )

    $("#library-view").find("#cancel").off("click").on("click", abortLibrary )
}
function abortLibrary(){
    unfocus()
    $("#library-view").hide()
}

unwarn()
unconfirm()
unprompt()
abortLoader()
abortLibrary()
