const startedAt = new Date()
var safe = false
var timeLeft = 0;
var pathname = window.location.pathname

if( pathname.slice(-1) == "/"){
    pathname = pathname.slice(0,-1)
}

$(".timer").each( function(){
    let currentTime = parseInt( $(this).attr("data-tym") )
    const self = $(this)

    const interval = setInterval( () => {
        if( currentTime <= 0){ clearInterval( interval ) ; submit(); }
        if( currentTime == 30 ) self.addClass("red")

        const hr  = ( Math.floor( currentTime / 3600 )).toString()
        const min = ( Math.floor( currentTime / 60 ) % 60 ).toString()
        const sec = ( currentTime % 60).toString()
        
        self.text( hr.padStart(2,"00") + " : " + min.padStart(2,"00") + " : " + sec.padStart(2,"00") )
        currentTime --
        timeLeft = currentTime
    }, 1000)
})

show(0)

function show(i){
    let index = parseInt(i) % $(".question").length
    
    let answered = false
    const previous = $(".active")

    previous.find("[type='radio']").each( function(){
        if( $(this).prop("checked") ){
            answered = true
        }
    })

    const dataIndex = previous.attr("data-index") 

    if( dataIndex && parseInt( dataIndex ) !== i ){
        if( answered ){
            $( $(".q-index-span").get( parseInt( dataIndex ) ) )
            .removeClass("bad").addClass("good")
        }else{
            $( $(".q-index-span").get( parseInt( dataIndex ) ) )
            .removeClass("good").addClass("bad")
        }
    }

    const current = $(".question").css({
        display : "none",
        transform : "translateX(-100%)"
    })
    .removeClass("active")
    .get( index )

    

    $(current).css({
        display : "flex",
        transform : "translateX(0)"
    }).addClass("active")
}

function mark( btn, i){
    btn.state = ! btn.state
    if( btn.state ){
        $(btn).text("Remove marking")

        $( $(".q-index-span").get( parseInt( i ) ) )
        .addClass( "mark" )
    }else{
        $(btn).text("Mark for later")
        
        $( $(".q-index-span").get( parseInt( i ) ) )
        .removeClass( "mark" )
    }
}
function clearSelection(i){
    $($(".question").get( parseInt(i) )).find("[type='radio']")
    .each( function(){ this.checked = false })
}

function save( cb ){
    const toSave = {
        startedAt,
        timeLeft,
        answers : [],
    }
    $('.question').each( function(index){
        let a = "";
        $(this).find(".option").each( function(i){ 
            const radio = $(this).children("input")
            if( radio.prop("checked") || radio.is(":checked")){
                a = i
            } 
        })
        toSave.answers[index] = a
    }) 

    $.post(pathname.replace("attempt", "save" ), toSave, function( res ){
        if( cb ) cb( res ,toSave) ;
    })
    return toSave 
}

function pause(){
    confirm("Are you sure you want to pause exam?", function(){
        load("pausing")
        save(function( res ){
            safe = true
            console.log( res )
            window.opener.endExam()
            $(document.body).html("Exam has ended please quit this window")
        })
    })
}

function submit(){
    confirm("Are you sure you want to submit?", function(){
        load("submitting")
        save( function( res , toSave){
            console.log( res )
            $.post( pathname.replace("attempt", "end" ), toSave, function( res ){
                console.log( res )
                safe = true
                window.opener.endExam() 
                $(document.body).html("Exam has ended please quit this window")
            } )
        })
    })
}


function load( txt ){
    focus()
    $("#loading").find(".txt").text( txt )
    $("#loading").fadeIn(100)

}
function unload(){
    unfocus()
    $("#loading").fadeOut(100)
}
unload()


window.onbeforeunload = function (e) {
    if( ! safe ){
        pause()
        e = e || window.event;
        if (e) {
            e.returnValue = 'Sure?';
        }
        return 'Sure?';
    }
};
