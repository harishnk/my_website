var zoom = 1;
var width = 0;
var height = 0;
var curPg = 0;
var pgCount = 0;
var jpedal;
var container;
var mainContainer;
var type;
var sizes = new Array();
var thumbnailBar;
var thmbnls=false;
var outline=false;
var selectMode;

var isMobile;
var isMouseDown = false;
var mouseX;
var mouseY;

var CUR_DEFAULT = 0;
var CUR_GRAB = 1;
var CUR_GRABBING = 2;

var SEL_SELECT = 0;
var SEL_MOVE = 1;

function makeNavBar(pageCount, curPage, w, h, t, heights) {
    //type 0 = single pages
    //type 1 = splitspreads
    //type 2 = singlefile

    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    container = d("contentContainer");
    mainContainer = d("mainContent");
    pgCount = pageCount;
    curPg = curPage;
    width = w;
    height = container.clientHeight - 6;//-padding
    type = t;
    var opt;

    d('pgCount').innerHTML = "/" + pgCount;

    container.style.width = width + "px";
    container.style.height = height + "px";

    //Populate the goto dropdown with page numbers
    var goBtn = d("goBtn");

    if (type == 0) {
        jpedal = d("jpedal");

        for (var i = 1; i <= pgCount; i++) {
            opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = "" + i;
            goBtn.appendChild(opt);
        }
        goBtn.selectedIndex = curPage - 1;
    } else if (type == 1) {//splitspreads
        jpedal = d("container" + curPage);
        d("goBtn").style.width = "65px";

        opt = document.createElement('option');
        opt.value = 1;
        opt.innerHTML = "" + 1;
        goBtn.appendChild(opt);

        for (var i = 2; i <= pgCount; i += 2) {

            opt = document.createElement('option');
            opt.value = i;
            var text;
            if (i != pgCount || pgCount % 2 == 1) {
                text = "" + i + "-" + (i+1);
            } else {
                text = "" + i;
            }
            opt.innerHTML = text;
            goBtn.appendChild(opt);
        }

        goBtn.selectedIndex = curPage/2;

    } else if (type == 2) { //singlefile
        jpedal = d("jpedal");
        if (pageCount > 1) scrollEv(null);

        for (var i = 1; i <= pgCount; i++) {
            opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = "" + i;
            goBtn.appendChild(opt);

            if (i != pgCount) {
                d('page' + i).style.margin = "0 0 10px";
            } else {
                d('page' + i).style.margin = "";
            }

            var pageElm = d('page' + i);
            sizes[i] = {width: pageElm.clientWidth, height: pageElm.clientHeight};
        }
        goBtn.selectedIndex = curPage - 1;
    }

    jpedal.style.transformOrigin = "top left";
    jpedal.style.webkitTransformOrigin = "top left";
    jpedal.style.msTransformOrigin = "top left";
    jpedal.style.mozTransformOrigin = "top left";
    jpedal.style.oTransformOrigin = "top left";
    jpedal.style.margin = "0";

    if (!isMobile) {
        var zm = parseFloat(getURLParamValue('zoom'));
        var zoomBtn = d("zoomBtn");
        if (width > getWidth()) {
            zoomBtn.options[1].text = "100%";
            zoomBtn.options[2].text = "Fit Width (Reset)";
        }

        if (!isNaN(zm) && zm > 0 && zm != 1) {
            zoom = zm;
            updateZoom();
        } else if (width > getWidth()) {
            zoomBtn.selectedIndex = 2;
            zoomUpdate();
        }
    } else {
        var rm = d('btnZoomIn'); rm.parentNode.removeChild(rm);
        rm = d('zoomBtn'); rm.parentNode.removeChild(rm);
        rm = d('btnZoomOut'); rm.parentNode.removeChild(rm);
        rm = d('btnMove'); rm.parentNode.removeChild(rm);
		rm = d('btnSelect'); rm.parentNode.removeChild(rm);
    }
    thumbnailBar = document.getElementById("leftContent");

    loadThumbnailFrames(heights);
    // Initialise loaded array
    for(var i = 0; i < pgCount; i++){
        loadedThumbsArray[i] = false;
    }

    var curThumb = d('thumb' + curPage);
    curThumb.className = "thumbnail currentPageThumbnail";
    thumbnailBar.scrollTop = curThumb.getBoundingClientRect().top - 40;

    thmbnls = false;
    outline = false;
    d('btnOutlines').className = 'inactive';
    d('btnThumbnails').className = 'inactive';
    if (getURLParamValue('sidebar') == 'thumbnails') {
        thmbnls = true;
        outline = false;
    } else if (getURLParamValue('sidebar') == 'outlines') {
        thmbnls = true;
        outline = true
        d('btnThumbnails').className = '';
    }

    if (thmbnls) {
        d('main').style.left = "200px";
        d('left').style.width = "200px";
        scrollNext(-1);
    }
    if (outline) {
        d('thumbnailPanel').style.display = "none";
        d('outlinePanel').style.display = "inline";
    }

    selectMode = (getURLParamValue('mode') == 'pan') ? SEL_MOVE : SEL_SELECT;
    setSelectMode(selectMode);


    addevnt("scroll", thumbnailBar, sidebarUpdateEvent);

    if (type == 0 && curPg == 1) d('btnPrev').className = 'inactive';
    if (type == 0 && curPg == pgCount) d('btnNext').className = 'inactive';

    try {
        var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
        xmlhttp.onreadystatechange=function(){
            if (xmlhttp.readyState==4 && xmlhttp.status==200){
                d('outlinePanel').innerHTML = xmlhttp.responseText;
                if (outline) {
                    d('btnThumbnails').className = '';
                } else {
                    d('btnOutlines').className = '';
                }
            }
        }
        xmlhttp.open("GET","bookmarks/bookmarks.html",false);
        xmlhttp.send();
    } catch (e) {}

    d('left').style.transitionDuration = "200ms";
    d('main').style.transitionDuration = "200ms";
}

function getURLParamValue(param) {
    var url = document.URL;
    var jumIdx = url.toString().indexOf('?');
    var params = (jumIdx != -1) ? params = url.substr(jumIdx + 1).split("&") : "";
    for (var i = 0; i < params.length; i++) {
        params[i] = params[i].split('=');
        if (params[i][0] == param) {
            return params[i][1];
        }
    }
    return "";
}

function toggleOutlines(isOutlines) {
    if (outline && !isOutlines) {
        d('thumbnailPanel').style.display = "inline";
        d('outlinePanel').style.display = "none";
        thumbnailBar.scrollTop = d('thumb' + curPg).getBoundingClientRect().top - 40;
        outline = !outline;
        d('btnThumbnails').className = 'inactive';
        d('btnOutlines').className = '';
    } else if (isOutlines && d('btnOutlines').className != 'inactive') {
        d('thumbnailPanel').style.display = "none";
        d('outlinePanel').style.display = "inline";
        outline = !outline;
        d('btnThumbnails').className = '';
        d('btnOutlines').className = 'inactive';
    }
}


var loadedThumbsArray = new Array();
// Load the frames for all the thumbnails
function loadThumbnailFrames(heights){

    var thumbHeight;
    var repeat = 0;
    var heightsIndex = 0;

    for(var page = 1; page <= pgCount; page++){

        if(heights[heightsIndex] < 0 && repeat <= 0){
            repeat = Math.abs(heights[heightsIndex]) - 1;
            heightsIndex++;
        }else if(repeat > 0){
            repeat--;
        }else{
            thumbHeight = heights[heightsIndex];
            heightsIndex++;
        }

        var div = document.createElement("div");
        div.style.height=thumbHeight + "px";
        div.className = "thumbnail";
        div.id = "thumb" + page;
        div.setAttribute('onclick', 'goToPage(' + page + ');');
        div.setAttribute('title', 'Page ' + page);
        div.innerHTML='<img />';
        thumbnailBar.children[0].appendChild(div);
    }

}

function loadThumbnailAt(page){
    if(!loadedThumbsArray[page]) {
        thumbnailBar.children[0].children[page].children[0].setAttribute("src", "thumbnails/" + (page + 1) + ".png");
        loadedThumbsArray[page] = true;
    }
}

var scrlTop = 0;
var lastScroll = 0;
function sidebarUpdateEvent(evt){
    var scrollTop = thumbnailBar.scrollTop;
    lastScroll = scrlTop;
    scrlTop = scrollTop;

    setTimeout(function(){scrollNext(scrollTop);}, 200);
}

// Load the viewable thumbnails
// If -1 is passed as a param, it will load any unloaded viewable thumbnails (allows for reuse when first loading thumbs )
function scrollNext(scrollTop){
    if(scrollTop != scrlTop && scrollTop != -1)
        return;

    // load thumbs in view
    for(var thumbIndex = 0; thumbIndex < pgCount; thumbIndex++){
        if(!loadedThumbsArray[thumbIndex]){
            var curThumb = thumbnailBar.children[0].children[thumbIndex];
            // Bails out of the loop when the next thumbnail is below the viewable area
            if( curThumb.offsetTop > thumbnailBar.scrollTop + thumbnailBar.clientHeight){
                break;
            }
            if( (curThumb.offsetTop + curThumb.clientHeight) > thumbnailBar.scrollTop){
                loadThumbnailAt(thumbIndex);
            }
        }
    }
}

function setSelectMode(type) {
    //0 Text selectin (SEL_SELECT)
    //1 Panning (SEL_MOVE)

    selectMode = type;
    if (type == SEL_SELECT) {
        d('btnSelect').className = 'inactive';
        d('btnMove').className = '';
        container.style.cursor = getCursor(CUR_DEFAULT);
        container.onmousedown = function(e) { }
        window.onmouseup = function(e) { }
        window.onmousemove = function(e) { }
    } else {
        d('btnSelect').className = '';
        d('btnMove').className = 'inactive';
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }

        container.style.cursor = getCursor(CUR_GRAB);

        container.onmousedown = function(e) {
            container.style.cursor = getCursor(CUR_GRABBING);
            mouseX = e.screenX;
            mouseY = e.screenY;
            isMouseDown = true;
            return false;
        }
        window.onmouseup = function(e) {
            container.style.cursor = getCursor(CUR_GRAB);
            isMouseDown = false;
        }
        window.onmousemove = function(e) {
            if (isMouseDown) {
                mainContainer.scrollLeft = mainContainer.scrollLeft + mouseX - e.screenX;
                mainContainer.scrollTop = mainContainer.scrollTop + mouseY - e.screenY;
                mouseX = e.screenX;
                mouseY = e.screenY;
            }
        }
    }
}

function getCursor(type) {
    //0 Default (CUR_DEFAULT)
    //1 Open grab (CUR_GRAB)
    //2 Close grab (CUR_GRABBING)

    //Courtesy of http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isChrome = !!window.chrome && !isOpera;

    if (isFirefox) {
        if (type == CUR_DEFAULT) return "";
        else if (type == CUR_GRAB) return "-moz-grab";
        else return "-moz-grabbing";//CUR_GRABBING
    } else if (isChrome) {
        if (type == CUR_DEFAULT) return "";
        else if (type == CUR_GRAB) return "-webkit-grab";
        else return "-webkit-grabbing";//CUR_GRABBING
    } else {//CUR_DEFAULT
        if (type == CUR_DEFAULT) return "";
        else return "all-scroll";//CUR_GRABBING
    }
}

function getWidth() {
    var w = 0;
    if (self.innerHeight) {
        w = self.innerWidth;
    } else if (document.documentElement && document.documentElement.clientHeight) {
        w = document.documentElement.clientWidth;
    } else if (document.body) {
        w = document.body.clientWidth;
    }
    return w;
}

function updateZoom() {
    var scrollX = mainContainer.scrollLeft;
    var scrollY = mainContainer.scrollTop;
    var curHeight = d("contentContainer").getBoundingClientRect().height;

    jpedal.style.transform = "scale(" + zoom + ")";
    jpedal.style.WebkitTransform = "scale(" + zoom + ")";
    jpedal.style.msTransform = "scale(" + zoom + ")";
    jpedal.style.MozTransform = "scale(" + zoom + ")";
    jpedal.style.OTransform = "scale(" + zoom + ")";
    container.style.width = width * zoom + "px";
    container.style.height = height * zoom + "px";

    var percent = Math.floor(zoom*100) + "%";
    d("zoomBtn").options[0].innerHTML = percent;
    d("zoomBtn").selectedIndex = 0;

    var scaledBy = d("contentContainer").getBoundingClientRect().height / curHeight;
    mainContainer.scrollTop = scrollY * scaledBy;
}

function zoomIn() {
    zoom = zoom*1.2;
    updateZoom();
}

function zoomUpdate() {
    var index = d("zoomBtn").selectedIndex;

    if (index == 0) {
        //Always current. Do nothing
    } else if (index == 1) {//Reset
        zoom = 1;
    } else if (index == 2) {//Fit Width
        var winWidth = mainContainer.clientWidth;
        if (type == 2) {
            width = sizes[curPg].width;
        }
        zoom = (winWidth - 6) / width;
    } else if (index == 3) {//Fit Height
        var winHeight = mainContainer.clientHeight;
        var hScale = (winHeight - 6) / height;

        if (type == 2) {
            pgHeight = sizes[curPg].height;
            hScale = (winHeight - 6) / pgHeight;
        }
        zoom = hScale;
    } else if (index == 4) {//Fit Page
        var winWidth = mainContainer.clientWidth;
        var winHeight = mainContainer.clientHeight;
        var pgHeight;
        if (type == 2) {
            width = sizes[curPg].width;
            pgHeight = sizes[curPg].height;
        }
        var wScale = (winWidth - 6) / width;
        var hScale = (winHeight - 6) / height;//-6 because clientHeight doesn't take into account margins
        if (type == 2) {
            hScale = (winHeight - 6) / pgHeight;
        }

        if (wScale > hScale) {
            zoom = hScale;
        } else {
            zoom = wScale;
        }
    }

    updateZoom();
}

function zoomOut() {
    zoom = zoom/1.2;
    updateZoom();
}

function goToPage(pg) {
    if (pg == 0) {
        if (type == 0 || type == 2) {
            pg = d("goBtn").selectedIndex + 1;
        } else {
            pg = (d("goBtn").selectedIndex * 2) + 1;
        }
    }
    if (pg != curPg) {
        var paramArr = new Array();
        if (zoom != 1) paramArr[paramArr.length] = "zoom=" + zoom;
        if (thmbnls && !outline) paramArr[paramArr.length] = "sidebar=thumbnails";
        if (thmbnls && outline) paramArr[paramArr.length] = "sidebar=outlines";
        if (selectMode == SEL_MOVE) paramArr[paramArr.length] = "mode=pan";

        var params = "?";
        for (var i = 0; i < paramArr.length; i++) {
            if (i > 0) params = params + "&";
            params = params + paramArr[i];
        }
        if (params.length == 1) params = "";

        var link;
        if (type == 0) {
            link = getPageHref(pg, pgCount);
            window.open(link + ".html" + params, "_self");
        } else if (type == 1) {
            link = getMagazinePageHref(pg, pgCount);
            window.open(link + ".html" + params, "_self");
        } else if (type == 2) {
            mainContainer.scrollTop = mainContainer.scrollTop + d('page' + pg).getBoundingClientRect().top - 45;

            for (var i = 1; i <= pgCount; i++) {
                d('thumb' + i).className = "thumbnail";
            }
            d('thumb' + pg).className = "thumbnail currentPageThumbnail";
        }
    }
}

function getPageHref(page, count) {
    var iWithLeadingZeros = page.toString();
    var leadingZerosNeeded = count.toString().length - iWithLeadingZeros.length;

    if(page === 1) {
        iWithLeadingZeros = "index"
    } else {
        for(var n = 0; n < leadingZerosNeeded; n ++) {
            iWithLeadingZeros = "0" + iWithLeadingZeros;
        }
    }
    return iWithLeadingZeros;
}

function getMagazinePageHref(page, count) {
    if(page > count) page = count;
    if(page === 1)
        return getPageHref(page, count);
    else if(page % 2 === 0) {
        if(page === count)
            return getPageHref(page, count);
        else
            return getPageHref(page, count) + "-" + getPageHref(page + 1, count);
    } else {
        return getPageHref(page-1, count) + "-" + getPageHref(page, count);
    }
}

function next() {
    if (type == 1) {
        if (curPg+1 < pgCount) goToPage(curPg + 2);
    } else {
        if (curPg < pgCount) goToPage(curPg + 1);
    }
}

function prev() {
    if (curPg > 1) goToPage(curPg - 1);
}

function addevnt(evnt, elem, func) {
    if (elem.addEventListener) // W3C DOM
        elem.addEventListener(evnt,func,false);
    else if (elem.attachEvent) { // IE DOM
        var r = elem.attachEvent("on"+evnt, func);
        return r;
    }
}

function d(id){
    return document.getElementById(id);
}

function toggleThumbnails() {
    if (thmbnls) {
        d('main').style.left = "0";
        d('left').style.width = "0";
    } else {
        scrollNext(-1);
        d('main').style.left = "200px";
        d('left').style.width = "200px";
        sidebarUpdateEvent();
    }
    thmbnls = !thmbnls;
}

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.msFullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        }else if (document.body.mozRequestFullScreen) {
            document.body.mozRequestFullScreen();
        }else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen();
        } else {
            console.log("Fullscreen API is not supported");
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else {
            console.log("Fullscreen API is not supported");
        }
    }
}

if (intLoaded) { idrLoad(); } else { extLoaded = true; }
