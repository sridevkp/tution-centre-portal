var currentIndex = 0 ;
var pathname = window.location.pathname

if( pathname.slice(-1) == "/"){
    pathname = pathname.slice(0,-1)
}

if( ! data ){
    $.get(pathname.replace("edit", "load?ans=true"), function( res ){
        data = res
        loadQ()
    })
}else{
    data = { q : data.questions , a : data.answers  }
    loadQ()
}

function loadQ(){
    $(".questions").empty()
    currentIndex = 0 

    data.q.forEach( function( qData, index ){
        const ans = data.a[ index ]
        
        const div = newQuestion( currentIndex, qData.question, qData.options, ans )

        $(".questions").append( div )
        currentIndex ++
    })
    $(".questions").append( $('<div class="question-block center add-block"></div>') 
                            .click(function(){
                                const newBlock = newQuestion(currentIndex, "",[],0)
                                newBlock.insertBefore( this )
                                currentIndex ++
                            }))
}

function save( strict ){
    let questions = []
    let answers = []
    let error ;

    $(".question-block:not(.add-block)").each( function( index ){
        const question = $(this).find(".q").val()

        let options = []
        let a ;

        $(this).find(".option").each( function(i){ 
            options.push( $(this).text()) ; 
            const radio = $(this).children("input")
            if( radio.prop("checked") || radio.is(":checked")){
                a = i
            } 
        })

        questions.push({
            question , 
            options  ,
        })
        answers[index] = a

        if( question.toString().trim() == ""){
            error = true
            return warn("Please enter question @ question no:" + (index + 1), 3000)
        }
        if( options.length <= 1){
            error = true
            return warn("There must be atleast 2 options @ question no:"+ (index + 1), 3000)
        }
        if( a == undefined ){
            error = true
            return warn("Please select an answer before continueing @ question no:" + (index + 1), 3000)
        }
    })

    if( error && strict ){
        return 
    }
    const saveData = {
        questions,
        answers  ,
        marks : {
            max     : val('#correct') * questions.length ,
            correct : $("#correct").val(),
            wrong   : $("#wrong").val()
        },
        available : {
            from : new Date($("#fromtime").val()) ,
            to   : new Date($("#totime").val()),
        },
        duration  : val("#hours") * 3600 + val("#minutes") * 60 + val("#seconds") ,
        passMarks : $("#passmark").val(),
        trophies  : $("#trophies").val()
    }
    
    $.post(pathname+"/save", saveData ,function( res ){
        warn( res , 4000)
    })
}

function val(selector){ return parseInt($(selector).val()) }

function newQuestion( indexNo, q , optionsList , ans ){
    const qBlock = $("<div class='question-block center'>")
    const index  = $("<p class='index'>●</p>")
    const textarea = $('<textarea class="q" placeholder="Question" spellcheck="false" rows="1" required></textarea>')
                    .val( q )
                    .on("input", function(){
                        $(this).css("height" , "")
                        .css("height" , this.scrollHeight + 'px');
                    });

    const delte = $("<span class='center icon delete'><img src='/icons/trash.svg'></span>")
    .click( function(){  qBlock.fadeOut( () => { qBlock.remove()  } ) })

    const options = $("<div class='options center'>")

    optionsList.forEach( function( option , index ){
        let checked = index == ans ;

        const label = newOption( option, indexNo , checked)

        options.append( label )
    })

    const addQ = $("<div class='add-q center'></div>")

    const optionInput = $('<input type="text" class="add" placeholder="Add option">')
    const addOption   = $('<span class="add-btn icon"><img src="/icons/plus-square.svg" alt=""></span>')
    .on("click", function(){
        const label = newOption( optionInput.val(), indexNo )
                                .insertBefore( addQ )
        optionInput.val("")
    })

    addQ.append( optionInput )
    .append('<label class="underline">')
    .append( addOption )

    options.append( addQ )
    return qBlock.append( index, textarea, delte, options )
}

function newOption( txt, index, checked ){
    const remove = $('<span class="remove"><img src="/icons/remove.svg" alt=""></span>')
    const label = $("<label class='option center'>").text( txt )
    .append( remove )
    .append( $("<input type='radio' name='name-"+index+"'>").attr("checked", checked) )  

    remove.click(function(){ 
        label.fadeOut(100, function(){ label.remove() }).css("transform", "translateX(60%)")
    })
    return label 
}


setInterval(function(){
    if( $("#autosave").prop("checked") || $("#autosave").is(":checked") ) save() ;
},30000)

