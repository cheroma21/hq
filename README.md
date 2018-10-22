# HQ Answers

See a demo here: https://youtu.be/Xzgw3kH8ZcI
Check out the site here: http://jakemor.com/hq

Feel free to fork this project!

## About

This python script predicts HQ answers by Googling the question and seeing which of the answers show up most in google's 1st page of search results. It gets the text by sending a screenshot of the question and answers to google's vision api. In order for the program to grab the screen shot, it's necessary to mirror your iPhone's screen to your computer using quicktime. After getting the results it syncs them with firebase which updates the webpage immediatly. 

Warning: It is by no means perfect! But is probably better than you on average ;)

## Getting Started

1) git clone
2) set up google's vision api locally, set variables to your auth file etc...
3) plug in your phone to your computer and open quicktime. go to file->new movie, then hit the arrow next to the record button and select your phone. 
4) open a screenshot of a question on HQ and hit cmd+shift+4 to start taking a screenshot. Use the cross hairs of the cursor to determine the bounds of where the question and answers are. Take note of them and enter them in the get_screenshot() function in hq.py hint: (x,y,w,h)
6) create a firebase project and copy the project URL
5) Change the firebase url in index.html, hq.py, new_game.py, and game_over.py to your projects url.
6) upload index.html to a server or just open it locally. 

## Usage

During a game, mirror your phone to your mac. 

Run `python new_game.py` to update the site right before the game.
Run `python hq.py` to take a screenshot of the question and google it for answers
Run `python game_over.py` to return the site to it's inactive state.

Enjoy!

## Disclaimers

This website is NOT to be used during a live game. It's purpose is to show how programming can be fun, and to teach (that's why the code is public!). It's also meant to make HQ work a little harder to make their amazing game even harder to crack! 

Update: After some research I noticed that Toby Miller published a post on medium on Nov. 14th which uses similar techniques. Check out his great post here: https://medium.com/@tobymellor/hq-trivia-using-bots-to-win-money-from-online-game-shows-ce2a1b11828b

