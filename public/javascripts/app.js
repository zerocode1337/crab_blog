function addLoadEvent(func){
    var oldonload = window.onload;
    if(typeof window.onload != 'function'){
        window.onload = func;
    }else{
        window.onload = function(){
            oldonload();
            func();
        }
    }
}
addLoadEvent(upTo);

function upTo(){
    var topbtn = document.getElementById("top-btn");
    var timer = null;
    // var pagelookheight = document.documentElement.clientHeight;
    window.onscroll = function(){
        var backtop = document.body.scrollTop;
        if(backtop >= 100){
            topbtn.style.display = "block";
        }else{
            topbtn.style.display = "none";
        }
    }
    topbtn.onclick = function(){
        timer = setInterval(function(){
            var backtop = document.body.scrollTop;
            var speedtop = backtop/5;
            document.body.scrollTop = backtop - speedtop;
            if(backtop == 0){
                clearInterval(timer);
            }
        },30);
    }
}
