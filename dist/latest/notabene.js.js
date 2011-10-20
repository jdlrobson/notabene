/*!
|''Name''|notabene|
|''Version''|0.7.1|
|''License''|BSD (http://en.wikipedia.org/wiki/BSD_licenses)|
|''Source''|https://github.com/jdlrobson/notabene/blob/master/src/notabene.js|
!*/
var APP_PATH="/takenote";var RESERVED_TITLES=["takenote","dashboard","takenote_manifest.appcache","notabene.css","jquery-ui.min.js","jquery-json.min.js"];var RECENT_STORAGE_ID="takenote-recent";var config;if(window.navigator.standalone){$("#backstage a").click(function(a){window.location.href=$(a.target).attr("href");a.preventDefault();return false})}var notabene={defaultFields:{},loadConfig:function(){config=localStorage.getItem("_takeNoteConfig")?JSON.parse(localStorage.getItem("_takeNoteConfig")):{};if(config.noGeoTiddlers){if(new Date().getTime()-config.noGeoTiddlers>1000*60*60*24){notabene.saveConfig("noGeoTiddlers",false)}}},saveConfig:function(a,b){if(typeof(a)!="undefined"&&typeof(b)!="undefined"){config[a]=b}localStorage.setItem("_takeNoteConfig",JSON.stringify(config))},watchPosition:function(a){if(!!navigator.geolocation&&!config.noGeoTiddlers){navigator.geolocation.watchPosition(a,function(){notabene.saveConfig("noGeoTiddlers",new Date().getTime())})}},supports_local_storage:function(){try{return"localStorage" in window&&window.localStorage!==null}catch(a){return false}},clearRecentChanges:function(){localStorage.removeItem(RECENT_STORAGE_ID)},getRecentChanges:function(){var a=localStorage.getItem(RECENT_STORAGE_ID);a=a?$.parseJSON(a):[];return a},addRecentChange:function(d,e){var c=notabene.getRecentChanges();var f=[];for(var b=0;b<c.length;b++){var a=c[b];a=typeof(a)==="string"?{title:a}:a;if(a.title!==e){f.push(a)}}f.push({title:e,bag:d});f=f.length>5?f.slice(f.length-5):f;localStorage.setItem(RECENT_STORAGE_ID,$.toJSON(f))}};notabene.loadConfig();function autoResize(c,b){b=b||{};var a=function(g){c=g.target;var k=$("<div />").addClass($(c).attr("class")).hide().css({"word-wrap":"break-word"}).insertBefore($(c)[0]);var j=$(c).val()||"";var d=j.split("\n");for(var e=0;e<d.length;e++){$("<span />").text(d[e]).appendTo(k);$("<br />").appendTo(k)}var f=$(k).height();if(b.minHeight&&f<b.minHeight){f=b.minHeight}if(b.buffer){f+=b.buffer}$(g.target).height(f);$(k).remove()};$(c).focus(a).keyup(a).blur(a);$(c).focus()}function setup_store(b){b=b||{};var e=b.bag;var d=b.host;var c=new tiddlyweb.Bag(e,d);var a=new tiddlyweb.Store();a.retrieveCached();return{store:a,bag:c,host:d}}function init(a,b,d){if(localStorage.getItem("DEFAULT_SPACE")){b.space=localStorage.getItem("DEFAULT_SPACE");b.bag=b.space+"_public";d(b)}else{if(!b.bag&&!b.space){var c=new tiddlyweb.Store();c.getDefaults(function(f){var e=f.pushTo.name;b.space=e&&e.split("_").length==2?e.split("_")[0]:"frontpage";b.bag=e;localStorage.setItem("DEFAULT_SPACE",b.space);d(b)})}else{return d(b)}}}function notes(a,b){return init(a,b,function(h){backstage();window.onbeforeunload=function(){if(!notabene.supports_local_storage()&&l().dirty().length){return["There are unsynced changes. Are you sure you want to leave?\n\n","Please upgrade your browser if possible to make sure you never lose a note."].join("")}};var A=setup_store(h);var l=A.store;var c=A.bag;var v=A.host;var C=l().sort(function(G,F){return G.fields._modified<F.fields._modified?1:-1});var d,j;function g(M){var F={_created:{label:"created on"},_modified:{label:"last modified on"}};$("#notemeta").empty();var G=$('<div class="paddedbox" />').appendTo("#notemeta")[0];var L=$("<ul />").appendTo(G)[0];for(var K in M.fields){if(K.indexOf("_")!==0){var H=M.fields[K];if(H){var N=F[K]?F[K].label:K;$("<li />").text(N+": "+H).appendTo(L)}}}var O=M.tags||[];if(O.length>0){var I=$("<li />").appendTo(L);$("<span />").text("tags : ").appendTo(I);for(var J=0;J<O.length;J++){$("<span />").text(O[J]).appendTo(I);$('<a class="removeTag">remove</a>').data("tag",O[J]).click(function(Q){var P=$(Q.target).data("tag");E(P);x();Q.preventDefault()}).appendTo(I)}}}function i(){$(".note_title").val("");$(".note_text").val(d.text);if(d.title!=j&&d.fields._title_set){$(".note_title").val(d.title).focus()}if(d.fields._title_validated){$(".note_title").blur().attr("disabled",true);$(document.body).addClass("validatedNote")}else{$(".note_title").attr("disabled",false);$(document.body).removeClass("validatedNote")}g(d);notabene.watchPosition(function(G){if(d.fields["geo.lat"]&&d.fields["geo.long"]){return}if(G){var F=G.coords;d.fields["geo.lat"]=String(F.latitude);d.fields["geo.long"]=String(F.longitude)}})}function r(){return"untitled note "+Math.random()}function u(){j=r();d=new tiddlyweb.Tiddler(j,c);d.fields={};d.tags=[];d.fields._created=new Date();i()}function B(F,G,I){var H=$(".messageArea",a);H=H.length>0?H:$("<div class='messageArea' />").appendTo(a);H.attr("class","messageArea displayed").html("<div>"+F+"</div>");$(".messageArea div").stop(false,false).show();if(I){$(".messageArea div").css({opacity:1}).fadeOut(5000)}if(G){$(H).addClass(G)}}function q(){var G=$(".syncButton");var F=l().dirty();$(G).text(F.length);renderIncomplete(l,c.name)}function z(F,G){d=new tiddlyweb.Tiddler(F);d.fields={};d.bag=new tiddlyweb.Bag(G||c.name,v);l.get(d,function(H,J,I){var K=I?I.status===404:false;if(H){delete H.fields.created;delete H.fields.modified;d=H}else{if(!K){e()}}if(l().title(d.title).bag(c.name).dirty().length===0){if(H){d.fields._title_validated="yes"}}if(K||H){d.fields._title_set="yes"}$(a).addClass("ready");i()})}function y(){var G=$(".syncButton");G=G.length>0?G:$("<div class='syncButton' />").prependTo(a);q();G.click(function(L){var J,N=0,M=[];var K=l().dirty();B("Syncing to server");var H=function(O){if(O){notabene.addRecentChange(O.bag.name,O.title)}if(N===0){if(K.length>0){B("Finish your note '"+d.title+"' before syncing.","warning")}else{B("Nothing to sync.","warning")}}else{if(M.length>0){B("Sync failed. Please rename some of your notes.","error")}else{if(O&&!J){B("Sync completed.","",true)}else{J=true;B("Unable to fully sync at current time.","warning")}}}q()};var I=$(".note_title").val();K.each(function(O){if(O.title!==I){N+=1;k(O,function(P,Q){if(Q){l.save(P,H)}else{M.push(P);H(false)}})}else{H(false)}})});function F(){var K=window.location.hash;var J=K.match(/tiddler\/([^\/]+)$/);var L=K.match(/tiddler\/$/);if(J&&J[1]){var H=K.match(/bags\/([^\/]*)\//);var I=H&&decodeURIComponent(H[1])?H[1]:undefined;if(K.indexOf("quickedit/")>-1){$("#newnote,#cancelnote").addClass("quickedit")}z(decodeURIComponent(J[1]),I)}else{if(!L&&C[0]){d=C[0];i();if($(".takenotedashboard").length===0){setTimeout(function(){var M=["We've restored your last incomplete note for you to finish and save. ","<a href='/takenote#tiddler/'>Start a new note</a> if you prefer."].join("");B(M,"",true)},500)}}else{u()}$(a).addClass("ready")}if(h.space){$.ajax({url:"/spaces/"+h.space+"/members",error:function(){var M=["You are not a member of this space. ","Any notes you create will not be saved to the server. "].join("");B(M,"error",false)}})}}F();if(window.addEventListener){window.addEventListener("hashchange",F,true)}}function t(G){var F=!G.text?true:false;var H=G.fields&&G.fields._title_set?false:true;return H&&F?true:false}function x(){d.fields._modified=new Date();if(!t(d)){l.add(d)}q()}function o(G){var F=d.title;if(G!==F&&!t(d)){d.title=G;l.add(d);l.remove(new tiddlyweb.Tiddler(F,c))}}function k(F,H){var G=new tiddlyweb.Tiddler(F.title,c);if(RESERVED_TITLES.indexOf(F.title)>-1){H(F,false,true)}else{if(F.fields._title_validated){H(F,true)}else{G.get(function(){H(F,false)},function(I){if(I.status==404){F.fields._title_validated="yes";H(F,true)}else{H(F,null,null,I)}})}}}var m;function s(G,H){H=H||function(){};var F=function(){if(m){B("Note title set.","",true);m=false}$(".note_title").attr("disabled",true)};k(d,function(J,K,I,M){if(K){F()}else{if(K===false){m=true;var L=I?"This name is reserved and cannot be used. Please provide another.":"A note with this name already exists. Please provide another name.";B(L,"error")}}H(K,M)})}$(document).ready(function(){autoResize($("textarea.note_title")[0],{buffer:0,minHeight:60});autoResize($(".note_text")[0],{minHeight:250});$(".note_title").blur(function(F){var H=$(F.target).val();var G=$.trim(H);if(G.length>0){d.fields._title_set="yes";o(G);x()}else{delete d.fields._title_set;o(r())}}).keydown(function(F){if(F.keyCode===13){F.preventDefault()}})});function E(F){var G=d.tags||[];var I=[];for(var H=0;H<G.length;H++){if(G[H]!==F){I.push(G[H])}}d.tags=I;g(d)}function n(F){var G=d.tags||[];F=["excludeLists","excludeSearch","systemConfig","excludeMissing"].indexOf(F)>-1?F:F.toLowerCase();if(G.indexOf(F)===-1){G.push(F)}d.tags=G;g(d)}function f(I){var G=I.text.match(/#([^ \n#]+)/gi);var J=[];for(var H=0;H<G.length;H++){var F=G[H].substr(1);if(J.indexOf(F)===-1){J.push(F)}}return J}function p(){var G=f(d);for(var F=0;F<G.length;F++){n(G[F])}}var D=[];var w=function(F){if(F===8){D.pop()}else{if(F===32||F===13){if(D.length>1){p()}D=[]}else{if(F===35){if(D.length>1){p();D=["#"]}else{D=["#"]}}else{if(D.length>0){D.push(String.fromCharCode(F))}}}}};$(".note_text").keydown(function(F){d.text=$(F.target).val();if(F.keyCode===8){w(F.keyCode)}x()}).keypress(function(F){d.text=$(F.target).val();w(F.keyCode)}).keyup(function(F){d.text=$(F.target).val();x()}).blur(function(F){if(D.length>0){p()}D=[]}).click(function(F){D=[]}).focus(function(F){D=[]});function e(){$("#note").removeClass("active");$(".note_title, .note_text").val("").attr("disabled",false);window.location.hash="";u();q()}$("#newnote").click(function(G){B("Saving note...");var F=$(G.target).hasClass("quickedit");s(d.title,function(H,I){if(H){l.save(d,function(M,K){if(M){notabene.addRecentChange(M.bag.name,d.title);$("#note").addClass("active");var L=encodeURIComponent(d.title);if(F){window.location=document.referrer||"/"+L}else{var J="/bags/"+M.bag.name+"/tiddlers/"+L;var N=$("<div />").append($("<a />").attr("href",J).text(d.title)).html();B("Saved "+N+" successfully.",null,true)}e()}else{if(I&&I.status===403){B("You are not logged into takenote.Please <a href='/challenge'>login</a> to post notes to the web.","warning")}else{B("Saved locally. Unable to post to web at current time.","warning")}e()}})}else{if(H==null){B("Saved locally. Unable to post to web at current time.","warning");e()}}})});$("#deletenote").click(function(H){var G=confirm("Delete this note?");if(!G){return}B("Deleting note...");if(d){var F=d.fields._title_validated?true:false;l.remove({tiddler:d,server:F},function(I,K,J){q();if(J&&J.status===0){B("Could not delete from server at current time.","warning",true);x();e()}else{if(I){$("#note").addClass("deleting");B("Note deleted.",null,true);$("#note").removeClass("deleting");$(".note_title, .note_text").val("").attr("disabled",false);e()}else{B("Error deleting note. Please try again.","error")}}})}});$("#cancelnote").click(function(H){var G=confirm("Cancel editing this note and revert to previous online version?");if(G){var F=$(H.target).hasClass("quickedit");l.remove(d.title);e();if(F){window.location=document.referrer||"/"+encodeURIComponent(d.title)}}});y();return{init:y,resetNote:e,findTags:f,tagHandler:w,printMessage:B,newNote:u,loadNote:i,addTag:n,removeTag:E,store:l,printMetaData:g,validateCurrentNoteTitle:s,getNote:function(){return d},tempTitle:j,loadServerNote:z}})}function backstage(){var a,d,c;function b(){if(d){return}else{d=true;$.ajax({url:"/status",success:function(e){a=true;d=false;$("body").addClass("online");if(!c){c=true}},error:function(){a=false;d=false;$("body").removeClass("online")}})}}b();window.setInterval(b,60000)}function renderIncomplete(a,g){var e=a().dirty().sort(function(i,h){return i.title<h.title?-1:1});var c=$("#incomplete").empty()[0];if(c){for(var b=0;b<e.length;b++){var d=$("<li />").appendTo(c)[0];var f=e[b].title;$("<a />").attr("href",APP_PATH+"#!/tiddler/"+f).text(f).appendTo(d)}if(e.length===0){$("<li />").text("None.").appendTo(c)[0]}}}function dashboard(a,b){return notes(a,b,function(m){var e=$("#recentnotes");if(e.length>0){var l=notabene.getRecentChanges();function k(q){$(e).empty();if(q.length===0){$("<li />").text("No recently created notes.").appendTo(e)[0]}for(var o=0;o<q.length;o++){var n=$("<li />").appendTo(e)[0];var r=q[o];if(typeof(r)==="string"){r={title:r}}var p=r.bag||m.bag;$("<a />").attr("href","/bags/"+p+"/tiddlers/"+encodeURIComponent(r.title)).text(r.title).appendTo(n)}}function f(){$.ajax({url:"/tiddlers?select=tag:!excludeLists&sort=-created&limit=5",dataType:"json",success:function(p){notabene.clearRecentChanges();for(var o=p.length-1;o>-1;o--){var n=p[o];notabene.addRecentChange(n.bag,n.title)}l=notabene.getRecentChanges();k(l.reverse())}})}f();k(l.reverse())}var g=500;var h=window.setInterval(function(){var n=$(".searching");if(n.length>0){var o=n.css("opacity");o=o?parseFloat(o,10):1;if(o>0.7){n.animate({opacity:0.6},g)}else{n.animate({opacity:1},g)}}},g);var d={},c=[];$.ajax({dataType:"text",url:"/bags/"+m.bag+"/tiddlers?select=tag:!excludeLists",success:function(n){c=n.split("\n")}});function i(q,n){q=q.toLowerCase();var p=[];for(var o=0;o<c.length;o++){var r=c[o];if(r.toLowerCase().indexOf(q)>-1&&n.indexOf(r)===-1){p.push({value:r,label:r,bag:m.bag})}}return p}$(".findnote").autocomplete({source:function(q,n){var p=$(this.element);p.addClass("searching");var o=q.term;if(d[o]){return n(d[o])}n(i(o,[]));$.ajax({url:"/search?q=bag:"+m.bag+' "'+o+' "&select=tag:!excludeLists',dataType:"json",success:function(t){p.removeClass("searching").css({opacity:1});var w=[];var v=i(o,v);for(var x=0;x<t.length;x++){var A=t[x];var u=A.bag;var s=u.split("_");var B=s[0];var y=s[1];var z=A.type;v.push(A.title);if(!z){w.push({value:A.title,label:A.title,bag:A.bag})}}if(w.length===0){w.push({label:"No notes found"})}d[o]=w;n(w)},error:function(){var r=[];r.concat(i(o,[]));if(r.length===0){r.push({label:"Unable to search at current time"})}p.removeClass("searching").css({opacity:1});n(r)}})},select:function(n,o){if(o.item.value&&o.item.bag){window.location="/bags/"+o.item.bag+"/tiddlers/"+encodeURIComponent(o.item.value)}}});var j=setup_store(m);renderIncomplete(j.store,j.bag.name)})}window.addEventListener("load",function(){window.setTimeout(function(){var a=new google.bookmarkbubble.Bubble();var b="bubble";a.setHashParameter=function(){localStorage.setItem(b,"yes")};a.hasHashParameter=function(){return localStorage.getItem(b)?true:false};a.getViewportHeight=function(){return window.innerHeight};a.getViewportScrollY=function(){return window.pageYOffset};a.registerScrollHandler=function(c){window.addEventListener("scroll",c,false)};a.deregisterScrollHandler=function(c){window.removeEventListener("scroll",c,false)};a.showIfAllowed()},1000)},false);addEventListener("load",function(){setTimeout(hideURLbar,0)},false);function hideURLbar(){window.scrollTo(0,1)};