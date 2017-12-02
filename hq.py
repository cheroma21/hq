# import libs
import io, os, urllib, requests, re, webbrowser, json

# Imports the Google Cloud client library
from google.cloud import vision
from google.cloud.vision import types
from subprocess import call

# import Bsoup
from bs4 import BeautifulSoup

class colors:
    blue = '\033[94m'
    red   = "\033[1;31m"
    green = '\033[0;32m'
    end = '\033[0m'
    bold = '\033[1m'


def get_screenshot(img_name):
	print "grabbing screenshot..."
	
	call(["screencapture","-R", "300,320,256,256", img_name])
	# call(["screencapture","-R", "14,190,445,480", img_name])
	call(["sips","-Z","350", img_name])

def run_ocr(img_name):
	print "running OCR..."
	client = vision.ImageAnnotatorClient()

	file_name = os.path.join( os.path.dirname(__file__), img_name)

	with io.open(file_name, 'rb') as image_file:
	    content = image_file.read()

	image = types.Image(content=content)

	response = client.text_detection(image=image)
	texts = response.text_annotations

	all_text = texts[0].description.strip()

	lines = all_text.split("\n")

	ans_1 = lines[-3].lower().encode('utf-8')
	ans_2 = lines[-2].lower().encode('utf-8')
	ans_3 = lines[-1].lower().encode('utf-8')

	del lines[-1]
	del lines[-1]
	del lines[-1]

	question = u" ".join([line.strip() for line in lines]).encode('utf-8')

	reverse = True

	return { 
		"question": question,
		"ans_1": ans_1,
		"ans_2": ans_2,
		"ans_3": ans_3,
	}

def google(q_list, num):
	params = {"q":" ".join(q_list), "num":num}
	url_params = urllib.urlencode(params)
	google_url = "https://www.google.com/search?" + url_params
	r = requests.get(google_url)

	soup = BeautifulSoup(r.text)
	spans = soup.find_all('span', {'class' : 'st'})

	text = u" ".join([span.get_text() for span in spans]).lower().encode('utf-8').strip()

	return text

def rank_answers(question_block):
	print "rankings answers..."
	
	question = question_block["question"]
	ans_1 = question_block["ans_1"]
	ans_2 = question_block["ans_2"]
	ans_3 = question_block["ans_3"]

	reverse = True

	if " not " in question.lower():
		print "reversing results..."
		reverse = False

	text = google([question], 50)

	results = []

	results.append({"ans": ans_1, "count": text.count(ans_1)})
	results.append({"ans": ans_2, "count": text.count(ans_2)})
	results.append({"ans": ans_3, "count": text.count(ans_3)})

	sorted_results = []

	sorted_results.append({"ans": ans_1, "count": text.count(ans_1)})
	sorted_results.append({"ans": ans_2, "count": text.count(ans_2)})
	sorted_results.append({"ans": ans_3, "count": text.count(ans_3)})

	sorted_results.sort(key=lambda x: x["count"], reverse=reverse)

	# if there's a tie redo with answers in q

	if (sorted_results[0]["count"] == sorted_results[1]["count"]):
		# build url, get html
		print "running tiebreaker..."

		text = google([question, ans_1, ans_2, ans_3], 50)

		results = []

		results.append({"ans": ans_1, "count": text.count(ans_1)})
		results.append({"ans": ans_2, "count": text.count(ans_2)})
		results.append({"ans": ans_3, "count": text.count(ans_3)})

	return results

def print_question_block(question_block):
	print "\n"
	print "Q: ", question_block["question"]
	print "1: ", question_block["ans_1"]
	print "2: ", question_block["ans_2"]
	print "3: ", question_block["ans_3"]
	print "\n"

	

def save_question_block(question_block):

	question = question_block["question"].replace(",", "").replace("\"", "").replace("\'", "")
	ans_1 = question_block["ans_1"].replace(",", "").replace("\"", "").replace("\'", "")
	ans_2 = question_block["ans_2"].replace(",", "").replace("\"", "").replace("\'", "")
	ans_3 = question_block["ans_3"].replace(",", "").replace("\"", "").replace("\'", "")

	with open('questions.csv', 'a') as file:
		file.write("\t".join([question,ans_1,ans_2,ans_3 + "\n"]))
		file.close()

def print_results(results):

	# print results

	print "\n"

	small = min(results, key= lambda x: x["count"])
	large = max(results, key= lambda x: x["count"])

	for (i,r) in enumerate(results):
		text = "%s - %s" % (r["ans"], r["count"])

		

		if r["ans"] == large["ans"]:
			print colors.green + text + colors.end
		elif r["ans"] == small["ans"]:
			print colors.red + text + colors.end
		else:
			print text

	print "\n"

# def sync_results(results):

def sync_questions(question_block):

	data = {
		"question": question_block["question"], 
		"ans_1": question_block["ans_1"], 
		"ans_2": question_block["ans_2"], 
		"ans_3": question_block["ans_3"],
		"ans_1_count": 0,
		"ans_2_count": 0,
		"ans_3_count": 0,
		"correct_ans": "",
		"thinking": True
	}

	url = "https://hq-hack.firebaseio.com/q1.json"
	r = requests.put(url, data=json.dumps(data))
	print r.text

def sync_results(question_block, results):

	
	to_check = max(results, key= lambda x: x["count"])

	if " not " in question_block["question"].lower():
		to_check = min(results, key= lambda x: x["count"])

	correct_ans = ""

	for (i,r) in enumerate(results):
		if r["ans"] == to_check["ans"]:
			correct_ans = "ans_%s" % (i + 1)

	
	data = {
		"question": question_block["question"], 
		"ans_1": question_block["ans_1"], 
		"ans_2": question_block["ans_2"], 
		"ans_3": question_block["ans_3"],
		"ans_1_count": results[0]["count"],
		"ans_2_count": results[1]["count"],
		"ans_3_count": results[2]["count"],
		"correct_ans": correct_ans,
		"thinking": False
	}

	url = "https://hq-hack.firebaseio.com/q1.json"
	r = requests.put(url, data=json.dumps(data))
	print r.text

def main():

	print "\n"
	
	get_screenshot("q.png")
	question_block = run_ocr("q.png")
	print_question_block(question_block)
	sync_questions(question_block)
	save_question_block(question_block)
	results = rank_answers(question_block)
	print_results(results)
	sync_results(question_block, results)
	
	print "-----------------"


if __name__ == "__main__":
    
    main()

