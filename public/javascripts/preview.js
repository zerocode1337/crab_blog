
addLoadEvent(test);
// addLoadEvent(scrol);
function test(){
    // alert("aaa");
    var toc = document.getElementById("TOC");
    if(!toc){
        toc = document.createElement("ul");
        toc.id = "TOC";
        // toc.setAttribute("class","nav nav-tabs nav-stacked");
        // toc.setAttribute("data-spy","affix");
        // toc.setAttribute("data-offset-top","125");
        document.getElementById("preview").insertBefore(toc,document.getElementById("preview").firstChild);
    }

    var headings;
    if(document.querySelectorAll)
    headings = document.querySelectorAll("h2,h3");
    else
    headings = findHeadings(document.body,[]);
    function findHeadings(root,sects){
        for(var c = root.firstChild; c != null; c = c.nextSibling){
            if(c.nodeType !== 1) continue;
            if(c.tagName.length == 2 && c.tagName.charAt(0) == "H")
            sects.push(c);
            else
            findHeadings(c,sects);
        }
        return sects;
    }

    var sectionNumbers = [0,0,0,0,0,0];
    for(var h = 0; h < headings.length; h++){
        // alert(headings[h].firstChild.data);
        var heading = headings[h];
        if(heading.parentNode == toc) continue;
        var level = parseInt(heading.tagName.charAt(1));
        // alert(level);
        if(isNaN(level) || level <= 1 || level > 6) continue;
        sectionNumbers[level-1]++;
        for(var i = level; i < 6; i++) sectionNumbers[i] = 0;
        var sectionNumber = sectionNumbers.slice(0,level).join(".");

        var span = document.createElement("span");

        span.className = "TOCSectNum";

        span.innerHTML = sectionNumber;

        heading.insertBefore(span,heading.firstChild);
        // alert("kevin");
        var anchor = document.createElement("a");
        anchor.id = "TOC" + sectionNumber;
        heading.parentNode.insertBefore(anchor,heading);
        anchor.appendChild(heading);
        var link = document.createElement("a");
        link.id = "#TOC"+sectionNumber;
        link.href = "#TOC" + sectionNumber;
        link.innerHTML = heading.innerHTML;
        var entry = document.createElement("li");
        var newNumber = sectionNumber.split(".");
        var newSectionNumber = newNumber[0]+newNumber[1];
        // var newSectionNumber = sectionNumber.substring(0,3);
        entry.className = "TOCEntry TOCLevel" + level + " " + newSectionNumber;
        entry.appendChild(link);
        toc.appendChild(entry);

        // headings[h].onclick = function(){
        //     var ht=document.documentElement.scrollTop || document.body.scrollTop;
        //     // alert(ht + "===" + this.offsetTop);
        //     var temp_id = this.parentNode.id;
        //     var pre_id = document.getElementById("#"+temp_id);
        //     var pre_class = pre_id.parentNode.className;
        //     var prev_a = pre_class.split(" ");
        //
        //     prev = document.getElementsByClassName(prev_a[2]);
        //
        //         pre_id.style.color="red";
        //
        //         for(var i = 0; i < prev.length; i++){
        //
        //             prev[i].style.display = "inherit";
        //             prev[i].style.color="red";
        //         }
        //         var ss = (25.0/68.0)*document.documentElement.clientHeight-pre_id.offsetTop;
        //         document.getElementById("preview").style.top = ss+"px";
        //
        //
        // }
        (function() {
            window.addEventListener("scroll", scrollThrottler, false);

            var scrollTimeout;
            function scrollThrottler() {
                if ( !scrollTimeout ) {
                    scrollTimeout = setTimeout(function() {
                        scrollTimeout = null;
                        actualScrollHandler();
                    }, 60);
                }
            }
            function actualScrollHandler() {
                var ht=document.documentElement.scrollTop || document.body.scrollTop;
                for(var h = 0; h < headings.length-1; h++){
                    var temp_id = headings[h].parentNode.id;
                    var pre_id = document.getElementById("#"+temp_id);
                    var prev_arr = pre_id.parentNode.className;
                    var pre_arr = prev_arr.split(" ");
                    var flag;
                    if(pre_arr[1] == "TOCLevel2"){
                        flag = 1;
                    }
                    else{
                        flag = 0;
                    }
                    var prev = document.getElementsByClassName(pre_arr[2]);

                    if(headings[h].offsetTop<ht+10 && headings[h+1].offsetTop>ht+10){
                        pre_id.style.color="rgba(19, 255, 255, 0.65)";
                        pre_id.fontWeight="bold";
                        if(flag == 1){
                            for(var ii = 0; ii < prev.length; ii++){
                                prev[ii].style.display = "inherit";
                            }
                            var ss = (20.0/68.0)*document.documentElement.clientHeight-pre_id.offsetTop;
                            document.getElementById("preview").style.top = ss+"px";
                        }

                    }else{
                        pre_id.style.color="rgba(0, 34, 47, 0.7)";
                        pre_id.fontWeight="normal";

                    }

                }
            }
        }());
    }
}
