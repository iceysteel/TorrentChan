//I really hate writing javascript

//this initializes a webtorrent client
var client = new WebTorrent();
client.on('error', function (err) { console.log(err);})

//make request to server get the catalog, 
//right now this also has all the contents for every thread

var request = new XMLHttpRequest();
request.open('GET', '/catalog', true);

var data = [];
request.onload = function() {
  if (this.status >= 200 && this.status < 400) {
    // Success! put parsed stuff in data
    data = JSON.parse(this.response);
    consumeData(data);
  } else {
    // We reached our target server, but it returned an error
    console.log('server fucked up fam')
  }
};

request.onerror = function() {
  // There was a connection error of some sort
  console.log('connection error')
};

request.send();
//-----------------end request code---------

//TODO: FINISH THIS SHIT!!!
function updateThread(thread_id){
	var thread_request = new XMLHttpRequest();
	thread_request.open('GET', '/catalog', true);

	var data = [];
	request.onload = function() {
	  if (this.status >= 200 && this.status < 400) {
	    // Success! put parsed stuff in data
	    data = JSON.parse(this.response);
	    consumeData(data);
	  } else {
	    // We reached our target server, but it returned an error
	    console.log('server fucked up fam')
	  }
	};

	request.onerror = function() {
	  // There was a connection error of some sort
	  console.log('connection error')
	};

	request.send();
}


function sendThread(){
  var text = document.getElementById("comment").value;
  var title = document.getElementById("titleentry").value;
  var afile = document.getElementById("fileupload").files[0];
  console.log(afile);
  var textBlob = new Blob([text], {type : "text/plain"});
  var data = [textBlob, afile];

  //afile is null if you didnt attach a file
  if(!afile){
  	alert('You tried to make a thread without an image!');
  	return false;
  }

  client.seed(data, function(torrent) {
    var magnetLink = torrent.magnetURI;
    var threadRequest = new XMLHttpRequest();
    var data = new FormData();
    data.append('magnet', magnetLink);
    data.append('title', title);

    console.log(magnetLink);
    threadRequest.open('POST', '/post/thread/');
    threadRequest.send(data);
  });
  return false;
}

//called when a user hits submit on a post to send it to the server
function sendPost(post_id, thread_id){
  var text = document.getElementById("comment").value;
  var afile = document.getElementById("fileupload").files[0];
  var textBlob = new Blob([text], {type : "text/plain"});
  if(afile){
    var data = [textBlob, afile];
  }
  else{
    var data = [textBlob];
  }
  client.seed(data, function(torrent) {
    var magnetLink = torrent.magnetURI;
    var threadRequest = new XMLHttpRequest();
    var data = new FormData();
    data.append('magnet', magnetLink);

    console.log(magnetLink);


    threadRequest.open('POST', '/post/' + thread_id);
    threadRequest.send(data);
  });
  return false;

}

//this function takes the parsed data and appends it to the html as post elements
function consumeData(dataArray){
	// the contents of data are in this format Arrayofthreads[thread[posts]]
	console.log(dataArray);
	//iterate through all the threads
	for (var i = 0, len = dataArray.length; i < len; i++) {
	  thread = dataArray[i];

	  appendToBody(thread, true)

	  //now loop through the posts in the thread
	  //for (var j = 0, len2 = thread.posts.length; j < len2; j++) {
	  if(thread.posts.length < 3){
	  	for(var j = 0, len2 = thread.posts.length; j < len2; j++){ 
	  		appendToBody(thread.posts[j], false, thread.post_id);
	  	}
	  }else{
	  	//normal case, thread had more than 3 posts also display show posts
	  	for(var j = 0; j < 3; j++){
	  		appendToBody(thread.posts[j], false, thread.post_id);
	  	}

	  	appendShowPosts(thread);
	  }

	}
}

//this function appends a div that the user can use to expand threads
function appendShowPosts(thread){
	var threadDiv = document.createElement('div');
	threadDiv.setAttribute('class', 'thread');

	var introP = document.createElement('p');
	introP.setAttribute('class', 'intro');

	threadDiv.setAttribute('class', 'post');
	link = '<a href="javascript:void(0)" onclick="expand(' + thread.post_id + ', this)">'
	//find a way to do this the textcontent way, cause this is a security problem
	introP.innerHTML = '<b>'+ (thread.posts.length-3).toString() + " posts hidden." + '</b> ' + link + 'Click to expand' + '</a>';
	threadDiv.appendChild(introP);
	//change this line later when we make a container
	document.body.appendChild(threadDiv);
		
}

//function thats called when user clicks show posts to 
function expand(thread_id, callingElement){
	for (var i = 0, len = data.length; i < len; i++) {
	  thread = data[i];

	  //now loop through the posts in the thread
	  //for (var j = 0, len2 = thread.posts.length; j < len2; j++) {
	  if(thread.thread_id === thread_id){

	  	callingDiv = callingElement.parentNode.parentNode;

	  	console.log(callingDiv);
	  	for(var j = 3, len2 = thread.posts.length; j < len2; j++){ 
	  		appendToBody(thread.posts[j], false, thread.post_id, callingDiv);
	  	}
	  }

	}
}


//called when the user clicks a post number to reply to a post
function reply(post_id, containing_thread_id){
  console.log("replied" + post_id);
  var textentry = document.getElementById("comment");
  var titleentry = document.getElementById("titleentry");
  var replyintro = document.getElementById("replyintro");
  var submitbutton = document.getElementById("submitbutton");
  var diebutton = document.getElementById("diebutton");
  diebutton.style.display = "inline-block";
  titleentry.style.display = "none";
  textentry.value = textentry.value + ">>" + post_id + "\n";
  replyintro.innerHTML = "<b>Reply to thread</b>";
  submitbutton.setAttribute("onclick", "sendPost(" + post_id +','+ containing_thread_id + ")");
  return true;
}

//reverts the post form to posting a new thread
function noreply(){
  var titleentry = document.getElementById("titleentry");
  var replyintro = document.getElementById("replyintro");
  var diebutton = document.getElementById("diebutton");
  diebutton.style.display = "none";
  titleentry.style.display = "inherit";
  replyintro.innerHTML = "<b>New Thread:</b>";
}

//this function was initially code just for threads that i modified
//too lazy to change the comments or varible names WATCH OUT
//containing_thread_id is only for posts
function appendToBody(thread, isThread, containing_thread_id, callingDiv){
	var threadDiv = document.createElement('div');
	threadDiv.setAttribute('class', 'thread');

	var introP = document.createElement('p');
	introP.setAttribute('class', 'intro');
	//in the furture replace anoymous with poster ids and stuff

	//a thread will have its own post id as the containing thread
	var replyString =  'No.<a href="javascript:void(0)" onclick=reply('+ thread.post_id + ','+ thread.post_id +')>' + thread.post_id + '</a>';

	if(isThread){

		threadDiv.setAttribute('class', 'thread');
		//find a way to do this the textcontent way, cause this is a security problem
		introP.innerHTML = '<b>'+  thread.title  + '</b> ' + 'Anonymous' +  ' ' + thread.post_time + ' ' + replyString
		//introP.textContent =  + 'Anonymous' +  ' ' + thread.post_time + ' ' + 'No.' + thread.post_id;
		
	}else{
		//if its just a regular post
		threadDiv.setAttribute('class', 'post');
		//introP.innerHTML = 'Anonymous' +  ' ' + thread.post_time + ' ' + 'No.' + thread.post_id;
		//include the containing thread's id if its a post
		replyString =  'No.<a href="javascript:void(0)" onclick=reply('+ thread.post_id +','+ containing_thread_id +')>' + thread.post_id + '</a>';

		introP.innerHTML = 'Anonymous' +  ' ' + thread.post_time + ' ' + replyString
	}
	//this div will contain files (pictures and stuff) in the future
	var filesDiv = document.createElement('div');
	filesDiv.setAttribute('class', 'files');
	var imgTag = document.createElement('img');
	


	var postBody = document.createElement('div');
	postBody.setAttribute('class', 'body');
	//right now the post body is just gonna be the magnet link

	//the post text or eventually html gets dropped into iframe elements for security
	var postFrame = document.createElement('iframe');
	postFrame.setAttribute('frameBorder', '0')
	postFrame.setAttribute("onload", "this.style.height=this.contentDocument.body.scrollHeight +'px';")

	//postP.innerHTML = 'magnet link: ' + thread.post_magnet_uri;
	var torrentId = thread.post_magnet_uri;  
	var cancel = false;

	//this is where we fetch the torrent
	client.add(torrentId, function (torrent) {
	  // first file is the post, second is the image for now
	  torrent.on('metadata',function() {
			  if (torrent.file.length > 4000000)
			  	torrent.pause();
			  });
	  var file = torrent.files[0];
	  var image = torrent.files[1];

	  //can only render text files to an iframe, may change this later
	  file.renderTo(postFrame);

	  if(image){
	  	imgTag.setAttribute('height', '200')
		imgTag.setAttribute('onclick', 'resize(this)')
	 	image.renderTo(imgTag);
	  }	

	}) 

	filesDiv.appendChild(imgTag);
	postBody.appendChild(postFrame);


	threadDiv.appendChild(introP);
	threadDiv.appendChild(filesDiv);
	threadDiv.appendChild(postBody);

	if(callingDiv){
		callingDiv.innerHTML = '';
		callingDiv.removeAttribute('class');
		callingDiv.appendChild(threadDiv);
	}else{
	//change this line later when we make a container
	document.body.appendChild(threadDiv);
	}
}

function resize(element){
	if(element.hasAttribute('height')){
		if(element.getAttribute('height') === '200'){
			element.setAttribute('height', '')
		}
		else{
			element.setAttribute('height', '200')
		}
	}
	
}
