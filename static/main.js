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

function sendThread(){
  var text = document.getElementById("comment").value;
  var title = document.getElementById("titleentry").value;
  var afile = document.getElementById("fileupload").files[0];
  console.log(afile);
  var textBlob = new Blob([text], {type : "text/plain"});
  var data = [textBlob, afile];
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

function sendPost(post_id){
  var text = document.getElementById("comment").value;
  var afile = document.getElementById("fileupload").files[0];
  console.log("NIGGERS");
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
    var thread_id = -1;
    var threadlength = data.length;
    for(var i = 0; i < threadlength; i++){
      var postlength = data[i].posts.length;
      for(var j = 0; j < postlength; j++){
        if (data[i].posts[j].post_id == post_id){
          console.log("found post thread");
          thread_id = data[i].post_id;
        }
      }
    }
    if(thread_id == -1){
      thread_id = post_id;
    }

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
	  for (var j = 0, len2 = thread.posts.length; j < len2; j++) {
	  	appendToBody(thread.posts[j], false);
	  }

	}
}

function reply(post_id){
  console.log("replied" + post_id);
  var textentry = document.getElementById("comment");
  var titleentry = document.getElementById("titleentry");
  var replyintro = document.getElementById("replyintro");
  var submitbutton = document.getElementById("submitbutton");
  titleentry.style.display = "none";
  textentry.value = textentry.value + ">>" + post_id + "\n";
  replyintro.innerHTML = "<b>Reply to thread</b>";
  submitbutton.setAttribute("onclick", "sendPost(" + post_id + ")");
  return true;
}

function noreply(){
  var titleentry = document.getElementById("titleentry");
  var replyintro = document.getElementById("replyintro");
  titleentry.style.display = "inherit";
  replyintro.innerHTML = "<b>New Thread:</b>";
}

//this function was initially code just for threads that i modified
//too lazy to change the comments
function appendToBody(thread, isThread){
	var threadDiv = document.createElement('div');
	threadDiv.setAttribute('class', 'thread');

	var introP = document.createElement('p');
	introP.setAttribute('class', 'intro');
	//in the furture replace anoymous with poster ids and stuff

	var replyString =  'No.<a href="javascript:void(0)" onclick=reply('+ thread.post_id +')>' + thread.post_id + '</a>';

	if(isThread){

		threadDiv.setAttribute('class', 'thread');
		//find a way to do this the textcontent way, cause this is a security problem
		introP.innerHTML = '<b>'+  thread.title  + '</b> ' + 'Anonymous' +  ' ' + thread.post_time + ' ' + replyString
		//introP.textContent =  + 'Anonymous' +  ' ' + thread.post_time + ' ' + 'No.' + thread.post_id;
		
	}else{
		threadDiv.setAttribute('class', 'post');
		//introP.innerHTML = 'Anonymous' +  ' ' + thread.post_time + ' ' + 'No.' + thread.post_id;
		introP.innerHTML = 'Anonymous' +  ' ' + thread.post_time + ' ' + replyString

	}
	//this div will contain files (pictures and stuff) in the future
	var filesDiv = document.createElement('div');
	filesDiv.setAttribute('class', 'files');
	var imgTag = document.createElement('img');
	imgTag.setAttribute('height', '200')
	imgTag.setAttribute('onclick', 'resize(this)')


	var postBody = document.createElement('div');
	postBody.setAttribute('class', 'body');
	//right now the post body is just gonna be the magnet link

	//the post text or eventually html gets dropped into iframe elements for security
	var postFrame = document.createElement('iframe');
	postFrame.setAttribute('frameBorder', '0')

	//postP.innerHTML = 'magnet link: ' + thread.post_magnet_uri;
	var torrentId = thread.post_magnet_uri;  

	//this is where we fetch the torrent
	client.add(torrentId, function (torrent) {
	  // first file is the post, second is the image for now
	  var file = torrent.files[0];
	  var image = torrent.files[1];

	  //can only render text files to an iframe, may change this later
	  file.renderTo(postFrame);
	  image.renderTo(imgTag);
	})

	filesDiv.appendChild(imgTag);
	postBody.appendChild(postFrame);


	threadDiv.appendChild(introP);
	threadDiv.appendChild(filesDiv);
	threadDiv.appendChild(postBody);

	//change this line later when we make a container
	document.body.appendChild(threadDiv);
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
