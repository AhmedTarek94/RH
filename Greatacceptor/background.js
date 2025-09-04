var enabled = false;
var found = false;
var notify = false;
var accept = false;
var interval = 60000;
var changes = new Audio('changes.ogg');
var reverse = localStorage["reverse"];
var xmlhttp = new XMLHttpRequest();
var sendemail = localStorage["sendemail"];
var emailaddress;
var lastRefresh = 0;
var refreshTimer;



chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      if ( tab.url.indexOf("/evaluation/rater") > -1 ) {
        
      if ( enabled == true ){

        
        
        chrome.tabs.executeScript(tabId,
          {code: 'var button = document.getElementsByClassName("button")[0]; button.innerHTML'
                  
          }, function(results){ 

            
            if(results[0] == "Acquire if available"){

                if(found == false) {
                  found=true;
                  if(accept == true) {
                  	notify = true;
                    chrome.tabs.executeScript(tabId, {code:'document.getElementsByClassName("button")[0].click();'} );
                    //createNotificationAccepted();
                  } else { 
                    //chrome.tabs.executeScript(tabId, {code:'setTimeout( function(){ window.location.reload(); },'+ interval +');'} );
                    refreshPage(tabId);
                    createNotificationFound(); 
                  }

                } else {
                  // add check for notify, if its still true then something went wrong..
                  if ( notify ) {
                    // refresh straight away
                    notify = false;
                    found = false;
                    
                    //chrome.tabs.executeScript(tabId, {code:'window.location.reload();'} );
                    chrome.tabs.reload(tabId);
                  } else {
                    //chrome.tabs.executeScript(tabId, {code:'setTimeout( function(){ window.location.reload(); },'+ interval +');'} );
                    refreshPage(tabId);
                    }
                }
              

            } else {
            	
                if ( found == false ) {
                  //chrome.tabs.executeScript(tabId, {code:'setTimeout( function(){ window.location.reload(); },'+ interval +');'} );
                  refreshPage(tabId);
                } else {

                  // what do we do if there is no button but weve found a task
                  chrome.tabs.executeScript(tabId, {code:'var notasks = document.getElementsByClassName("ewok-rater-no-tasks")[0]; notasks.innerText'}, function(results2) {
                    
                    if ( results2[0] == null && notify == true) { notify = false; createNotificationAccepted(); } else {
                    	
                    	if( results2[0].indexOf('No tasks') > -1 ) {

                      		found = false;
                      
                      		//chrome.tabs.executeScript(tabId, {code:'setTimeout( function(){ window.location.reload(); },'+ interval +');'} );
                            refreshPage(tabId);
                    	}

                	}
                  
                  } );

                }

            }
            
          } );

      } 
     } // check url close
    }

});

// handle any error except aborted
chrome.webRequest.onErrorOccurred.addListener(
  function(info) {
    
      if(enabled) {

        if ( info.url.indexOf("/evaluation/rater") > -1 ) {

              
              refreshPage(info.tabId);
      
        }
      
      }

    
  },
  {urls: ["https://www.raterhub.com/evaluation/rater*"], types: ["main_frame"]}
);


function refreshPage(tabId){

    // clear any exsisting timer
    clearTimeout(refreshTimer);

      refreshTimer = setTimeout(function() {

        chrome.tabs.get(tabId, function(tab2){   

          if ( enabled && tab2.url.indexOf("/rater/task") < 0 && tab2.url.indexOf("/evaluation/rater") > -1 ) {

              chrome.tabs.reload(tab2.id);

          }

        })

      }, interval);


}

// notifications
function createNotificationFound(){

    var opt = {type: "basic", title: "The Great Acceptor", message: "Task found, go grab it!", iconUrl: "acceptor-icon128.png"}

    chrome.notifications.create("found",opt,function(){});

    setTimeout(function(){chrome.notifications.clear("found",function(){});},5000);
  
    changes.play();

    // send an email
    emailaddress = localStorage["emailadd"];
    if ( emailaddress != null && sendemail != null) {
      if ( sendemail == "true" ) {
        xmlhttp.open("GET","https://thegreatacceptor.azurewebsites.net/api/TaskFound?code=9XhEZCsPZO5CqT/W/hcWCuYUDpwTbktOKSlzViJ7PraZE69JGEvCpg==&email="+emailaddress,true);
        xmlhttp.send();
      }
    }

}

function createNotificationAccepted(){

    var opt = {type: "basic", title: "The Great Acceptor", message: "Task accepted, get to work!", iconUrl: "acceptor-icon128.png"}

    chrome.notifications.create("accepted",opt,function(){});

    setTimeout(function(){chrome.notifications.clear("accepted",function(){});},5000);
  
    changes.play();

    // send an email
    emailaddress = localStorage["emailadd"];
    if ( emailaddress != null && sendemail != null) {
      if ( sendemail == "true" ) {
        xmlhttp.open("GET","https://thegreatacceptor.azurewebsites.net/api/TaskAccepted?code=hYak4osplE6mVgD6FW//HdWoafbjIBR/XnDWOuAodGTNuK9YC4LYjA==&email="+emailaddress,true);
        xmlhttp.send();
      }
    }

}

// off
function checkboxOnClickOff(info, tab) {
  
  enabled = false;
  notify = false;
  accept = false;
  found = false;

  // clear any exsisting timer
  clearTimeout(refreshTimer);

  chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
  chrome.browserAction.setBadgeText({text: "OFF"});

  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );

}

// refresh
function checkboxOnClickRefresh(info, tab) {
  
  enabled = true;
  notify = false;
  accept = false;

  chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 255, 255] });
  chrome.browserAction.setBadgeText({text: "REF"});

  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );

}

// refresh + accept
function checkboxOnClickAccept(info, tab) {
  
  enabled = true;
  //refresh = false;
  accept = true;

  chrome.browserAction.setBadgeBackgroundColor({ color: [0, 200, 0, 255] });
  chrome.browserAction.setBadgeText({text: "R+A"});

  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );

}

// interval functions
function checkboxOnClickInterval2(info, tab) {
  
  interval = 2000;
  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );
  alert("Wooah there! I like to refresh as much as the next moustached guy, but Leapforce requests that you do not refresh more than once a minute :(  Use at your own risk!");

}
function checkboxOnClickInterval5(info, tab) {
  
  interval = 5000;
  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );
  alert("Wooah there! I like to refresh as much as the next moustached guy, but Leapforce requests that you do not refresh more than once a minute :(  Use at your own risk!");

}
function checkboxOnClickInterval10(info, tab) {
  
  interval = 10000;
  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );
  alert("Wooah there! I like to refresh as much as the next moustached guy, but Leapforce requests that you do not refresh more than once a minute :(  Use at your own risk!");

}
function checkboxOnClickInterval30(info, tab) {
  
  interval = 30000;
  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );
  alert("Wooah there! I like to refresh as much as the next moustached guy, but Leapforce requests that you do not refresh more than once a minute :(  Use at your own risk!");

}
function checkboxOnClickInterval60(info, tab) {
  
  interval = 60000;
  chrome.tabs.executeScript(null, {code:'window.location.reload();'} );

}

function checkboxOnClickSendEmail(info, tab) {
  
  if (info.checked) {
    sendemail = "true";

    if ( !localStorage["emailadd"] ) {
      alert("Set your email address in options or email will not be sent!");
    }

  } else {
    sendemail = "false";
  }

  localStorage["sendemail"] = sendemail;

}

function checkboxOnClickSoundChanges(info, tab) {
  
  localStorage["reverse"] = "false";
  changes = new Audio('changes.ogg');
  changes.play();

}

function checkboxOnClickSoundReverse(info, tab) {
  
  localStorage["reverse"] = "true";
  changes = new Audio('changesreverse.ogg');
  changes.play();

}


// create buttons
var docUrl = "https://www.raterhub.com/evaluation/rater*";

var checkbox0 = chrome.contextMenus.create(
  {"title": "Off", "type": "radio" ,"onclick":checkboxOnClickOff, "documentUrlPatterns": [docUrl]});
var checkbox1 = chrome.contextMenus.create(
  {"title": "Refresh", "type": "radio", "onclick":checkboxOnClickRefresh,"documentUrlPatterns": [docUrl]});
var checkbox2 = chrome.contextMenus.create(
  {"title": "Refresh + Accept", "type": "radio", "onclick":checkboxOnClickAccept,"documentUrlPatterns": [docUrl]});

// email button
if ( sendemail == null || sendemail == "false" ) {
  
var checkboxe = chrome.contextMenus.create(
  {"title": "Email Notification", "type": "checkbox", "onclick":checkboxOnClickSendEmail,"documentUrlPatterns": [docUrl]});
} else {
  
var checkboxe = chrome.contextMenus.create(
  {"title": "Email Notification", "type": "checkbox", "checked": true , "onclick":checkboxOnClickSendEmail,"documentUrlPatterns": [docUrl]});
}

// create sound buttons
var sparent = chrome.contextMenus.create({"title": "Notification Sound","documentUrlPatterns": [docUrl]});
var schild1 = chrome.contextMenus.create(
  {"title": "Changes", "parentId": sparent, "type": "radio", "onclick": checkboxOnClickSoundChanges,"documentUrlPatterns": [docUrl]});
var schild2 = chrome.contextMenus.create(
  {"title": "Changes (Reverse)", "parentId": sparent, "type": "radio", "onclick": checkboxOnClickSoundReverse,"documentUrlPatterns": [docUrl]});

if (reverse == "true") {
  chrome.contextMenus.update(schild2, {"checked": true});
  changes = new Audio('changesreverse.ogg');
}

// create interval buttons
var parent = chrome.contextMenus.create({"title": "Refresh Interval","documentUrlPatterns": [docUrl]});

var child5 = chrome.contextMenus.create(
  {"title": "60 Seconds", "parentId": parent, "type": "radio", "onclick": checkboxOnClickInterval60,"documentUrlPatterns": [docUrl]});
var child4 = chrome.contextMenus.create(
  {"title": "30 Seconds", "parentId": parent, "type": "radio", "onclick": checkboxOnClickInterval30,"documentUrlPatterns": [docUrl]});
var child3 = chrome.contextMenus.create(
  {"title": "10 Seconds", "parentId": parent, "type": "radio", "onclick": checkboxOnClickInterval10,"documentUrlPatterns": [docUrl]});
var child2 = chrome.contextMenus.create(
  {"title": "5 Seconds", "parentId": parent, "type": "radio", "onclick": checkboxOnClickInterval5,"documentUrlPatterns": [docUrl]});
var child1 = chrome.contextMenus.create(
  {"title": "2 Seconds", "parentId": parent, "type": "radio", "onclick": checkboxOnClickInterval2,"documentUrlPatterns": [docUrl]});


// set badge to off
chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
chrome.browserAction.setBadgeText({text: "OFF"});