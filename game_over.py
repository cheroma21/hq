# import libs
import requests, json

def main():

	data = {
		"question": "<small style='color: gray;'>Check back before next game</small><br><br>What does this site do?", 
		"ans_1": "Nothing", 
		"ans_2": "Everything", 
		"ans_3": "Predicts HQ answers",
		"ans_1_count": 0,
		"ans_2_count": 40,
		"ans_3_count": 100,
		"correct_ans": "ans_3",
		"thinking": False
	}

	url = "https://hq-hack.firebaseio.com/q1.json"
	r = requests.put(url, data=json.dumps(data))
	print r.text


if __name__ == "__main__":
    
    main()

