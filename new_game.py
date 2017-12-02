# import libs
import requests, json

def main():

	data = {
		"question": "<small style='color: gray;'>Game is live</small><br><br>Waiting for them to stop _______ ?", 
		"ans_1": "Dancing", 
		"ans_2": "Chirping", 
		"ans_3": "Talking",
		"ans_1_count": 0,
		"ans_2_count": 100,
		"ans_3_count": 20,
		"correct_ans": "ans_2",
		"thinking": False
	}

	url = "https://hq-hack.firebaseio.com/q1.json"
	r = requests.put(url, data=json.dumps(data))
	print r.text


if __name__ == "__main__":
    
    main()

