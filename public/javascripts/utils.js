function createRequest(){
    try{
        request = new XMLHttpRequest();
    }catch(tryMS){
        try{
            request = new ActiveXObject("Msxm12.XMLHTTP");
        }catch(otherMS){
            try{
                request = new ActiveXObject("Microsoft.XMLHTTP");
            }catch(failed){
                request = null;
            }
        }
    }
    return request;
}
