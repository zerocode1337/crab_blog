function noteName(){
    document.getElementById("noteNameS").hidden = "";
    document.getElementById("noteName").innerHTML="请输入用户名";
}
function checkName(){
    var name = document.getElementById("inputName3").value;
    if(name == '' || name == undefined){
        document.getElementById("noteName").style.color = "red";
        document.getElementById("noteNameS").hidden = "";
        document.getElementById("noteName").innerHTML="用户名不能为空";
        document.getElementById("icon-name").innerHTML="";
    }else if(name.length < 5 || name.length > 16){
        document.getElementById("noteName").style.color = "red";
        document.getElementById("noteNameS").hidden = "";
        document.getElementById("noteName").innerHTML="用户名长度不符(5-16)";
        document.getElementById("icon-name").innerHTML="";
    }else{
        request = createRequest();
        if(request == null){
            alert("该浏览器不支持Ajax技术!");
        }else{
            var url = "/checkName/"+name;
            request.onreadystatechange = showUsernameStatus;
            request.open("GET",url,true);
            request.send(null);
        }
    }
}
function checkVerify(){
    var verify = document.getElementById("inputVerify3").value;
    request = createRequest();
    if(request == null){
         alert("该浏览器不支持Ajax技术！");
    }else{
        var url = "/checkVerify/"+verify;
        request.onreadystatechange = showVerifyStatus;
        request.open("GET",url,true);
        request.send(null);
    }
}
function showVerifyStatus(){{
    if(request.readyState == 4){
        if(request.status == 200){
            if(request.responseText == "okay"){
                document.getElementById("noteVerifys").hidden = "hidden";
                document.getElementById("noteVerify").innerHTML = "";
                document.getElementById("icon-verify").innerHTML="<span class='glyphicon glyphicon-ok form-control-feedback' aria-hidden='true'></span>";
            }else{
                document.getElementById("noteVerify").style.color = "red";
                document.getElementById("noteVerifys").hidden = "";
                document.getElementById("noteVerify").innerHTML="验证码不正确";
                document.getElementById("icon-verify").innerHTML="";
            }

        }
    }
}}
function showUsernameStatus(){
    if(request.readyState == 4){
        if(request.status == 200){
            if(request.responseText == "okay"){
                document.getElementById("noteNameS").hidden = "hidden";
                document.getElementById("icon-name").innerHTML="<span class='glyphicon glyphicon-ok form-control-feedback' aria-hidden='true'></span>";
            }else{
                document.getElementById("noteName").style.color = "red";
                document.getElementById("noteNameS").hidden = "";
                document.getElementById("noteName").innerHTML="用户名被占用";
                document.getElementById("icon-name").innerHTML="";
            }
        }
    }
}
function notePassword(){
    document.getElementById("notePasswordS").hidden = "";
    document.getElementById("notePassword").innerHTML="请输入密码";
}
function checkPassword(){
    var name = document.getElementById("inputPassword3").value;
    if(name == '' || name == undefined){
        document.getElementById("notePassword").style.color = "red";
        document.getElementById("notePasswordS").hidden = "";
        document.getElementById("notePassword").innerHTML="密码不能为空";
        document.getElementById("icon").innerHTML="";
    }else if(name.length < 6 || name.length > 16){
        document.getElementById("notePassword").style.color = "red";
        document.getElementById("notePasswordS").hidden = "";
        document.getElementById("notePassword").innerHTML="密码长度不符(6-16)";
        document.getElementById("icon-password").innerHTML="";
    }else{
        document.getElementById("notePasswordS").hidden = "hidden";

        document.getElementById("icon-password").innerHTML="<span class='glyphicon glyphicon-ok form-control-feedback' aria-hidden='true'></span>";
    }
}

function noteReap(){
    document.getElementById("notePasswordRepeatS").hidden = "";
    document.getElementById("notePasswordRepeat").innerHTML="请再次输入密码";
}
function checkPasswordAgain(){
    var name1 = document.getElementById("inputPasswordRepeat3").value;
    var name2 = document.getElementById("inputPassword3").value;
    if(name1 == '' || name1 == undefined){
        document.getElementById("notePasswordRepeat").style.color = "red";
        document.getElementById("notePasswordRepeatS").hidden = "";
        document.getElementById("notePasswordRepeat").innerHTML="密码不能为空";
        document.getElementById("icon-passwordRepeat").innerHTML="";
    }else if(name1 != name2){
        document.getElementById("notePasswordRepeat").style.color = "red";
        document.getElementById("notePasswordRepeatS").hidden = "";
        document.getElementById("notePasswordRepeat").innerHTML="密码不一致";
        document.getElementById("icon-passwordRepeat").innerHTML="";
    }else{
        document.getElementById("notePasswordRepeatS").hidden = "hidden";

        document.getElementById("icon-passwordRepeat").innerHTML="<span class='glyphicon glyphicon-ok form-control-feedback' aria-hidden='true'></span>";
    }
}
function checkall(){
    var flag1 = document.getElementById("icon-passwordRepeat").innerHTML;
    var flag2 = document.getElementById("icon-name").innerHTML;
    var flag3 = document.getElementById("icon-password").innerHTML;

    if(flag1 != "" && flag2 != "" && flag3 != ""){
        return true;
    }
    return false;
}

