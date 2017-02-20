from flask import Flask
#use markup later to escape html in strings that come from users
from flask import Markup
from flask import request
from io import BytesIO
from captcha.image import ImageCaptcha
import json
from time import gmtime, strftime

#REMOVE IN PRODUCTION FOR TESTING ONLY
if __name__ == '__main__':
      app.run(host='0.0.0.0', port=80)

#remove the static url path varible when we go to production
app = Flask(__name__, static_url_path='/static/')

#---------------classes for main data structures
class Post(object):
	"""each post is its own little torrent, this contains all the data to dl it"""
	def __init__(self, id, magnet):
		self.post_id = id
		self.post_magnet_uri = magnet
		self.reputation = 0
		#post time is a string
		self.post_time = strftime("%Y-%m-%d+%H:%M:%S", gmtime())


class Thread(Post):
	"""a thread is a post that has an array of other posts related to that thread in it"""
	def __init__(self, thr_id, magnet, title_param):
		super(Thread, self).__init__(thr_id, magnet)
		self.title = title_param
		self.thread_id = thr_id
		#the array of posts in this thread
		self.posts = []

	def toJSON(self):
		return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

class Captcha(object):
	def __init__(self, image, answer):
		self.image = image
		self.answer = answer
		self.active = True
	def isActive():
		return self.active
	def checkAnswer(response):
		active = False
		return answer == response
#---------------end classes-----------

#list that will hold all the threads on the chan in memory
global_threads = []

#list of active captcha objects
global_captchas = []

#list of all allowed posters
allowed_posters = []

#a hardcoded thread for testing
testThread = Thread(0, 'magnet:?xt=urn:btih:01047ad40ce0ee28f729d6181083207c22f452ff&dn=post.txt&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com', 'This is the first thread!')

#testPost = Post(1, 'magnet::this is another magnet link')
#testPost2 = Post(2, 'magnet::this is another another magnet link')

#testThread.posts.append(testPost)
#testThread.posts.append(testPost2)


global_threads.append(testThread)
#testThread.title = "this not a test"
#testThread.thread_id = 5
#global_threads.append(testThread)
#----------------end test data-------------

#global post counter to be used for ids
#CHANGE THIS BACK TO 0 AT SOME POINT
post_count = 2

def get_thread_by_id(thread_id_to_find):
#please forgive me, this method is fucking awful, 
#fix the algroithm and make it binary search asap
	return next((thread for thread in global_threads if thread.post_id==thread_id_to_find), None)

#-----------------application routes -------------------
#since this is served statically it needs to be removed once nginix is setup
@app.route('/')
def index():
	return app.send_static_file('client.html')


#HUGE SECURITY PROBLEM, REMOVE WHEN GOING TO PRODUCTION
@app.route('/static/<string:static_file>')
def temp_static_files(static_file):
	return app.send_static_file(static_file)


@app.route("/catalog")
def hello():
    return json.dumps(global_threads, default=lambda o: o.__dict__, sort_keys=True, indent=4)

#returns contents of a thread
@app.route("/thread/<int:thread_id>")
def show_thread(thread_id):
	if get_thread_by_id(thread_id) == None:
		return 'there was a problem finding thread#' + str(thread_id)
	else:
		return get_thread_by_id(thread_id).toJSON()

#this route takes POST requests and adds a post to a thread
@app.route("/post/<int:thread_id>", methods=['GET','POST'])
def create_post(thread_id):
	global allowed_posters
	#error = None
	if request.method == 'POST':
		#make sure we were sent the right data
		if request.form['magnet'] and request.remote_addr in allowed_posters:
			if get_thread_by_id(thread_id) == None:
				return 'there was a problem finding thread#' + str(thread_id)
			else:
				#calculate the new id
				global post_count
				post_count = post_count + 1
				#create a new post and append to the 
				new_post = Post(post_count, request.form['magnet'])
				#sometimes i really love these one liners you can make in python
				get_thread_by_id(thread_id).posts.append(new_post)
	else:
		return 'wrong kinda request bro.'

	return 'OK'

#this route makes a new thread
@app.route('/post/thread/', methods=['GET','POST'])
def create_thread():
	global allowed_posters
	if request.method == 'POST':
		if request.form['magnet'] and request.form['title'] and request.remote_addr in allowed_posters:
			#calculate the new id
			global post_count
			post_count = post_count + 1
			#create a new post and append to the 
			new_thread = Thread(post_count, request.form['magnet'], request.form['title'])
			global_threads.append(new_thread)
	else:
		return 'wrong kinda request bro.'

	return 'OK'

#this route gets or posts captcha
@app.route('/captcha/', methods=['GET','POST'])
def manage_captcha():
	global global_captchas
	global allowed_posters
	if request.method == 'POST':
		if request.form['captchanum'] and request.form['answer']:
			if request.form['captchanum'] <= global_captchas.length:
				if global_captchas[int(request.form['captchanum'])].isActive() and global_captchas[int(request.form['captchanum'])].checkAnswer(request.form['answer']):
					allowed_posters.add(request.remote_addr)
	elif request.method == 'GET':
		image = ImageCaptcha(fonts=['/usr/share/fonts/TTF/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSerif.ttf'])
		data = image.generate('1234')
		assert isinstance(data, BytesIO)
		image.write('1234', global_captchas.length + '.png')
		global_captchas.add(Captcha(global_captchas.length + '.png', '1234'))
		return send_file(global_captchas.length + '.png')
	else:
		return "WUT U DID SOMETHING WRONG"
