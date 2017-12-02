# HQ Answers

See a demo here: https://youtu.be/Xzgw3kH8ZcI
Check out the site here: http://jakemor.com/hq

Feel free to fork this project!

## Getting Started

1) git clone
2) set up google's vision api locally, set variables to your auth file etc...
3) plug in your phone to your computer and open quicktime. go to file->new movie, then hit the arrow next to the record button and select your phone. 
4) open a screenshot of a question on HQ and hit cmd+shift+4 to start taking a screenshot. Use the cross hairs of the cursor to determine the bounds of where the question and answers are. Take note of them and enter them in the get_screenshot() function in hq.py hint: (x,y,w,h)
6) create a firebase project and copy the project URL
5) Change the firebase url in both index.html, hq.py, new_game.py, and game_over.py to your projects url instead of mine.
6) upload index.html to a server or just open it locally. 

## Usage

During a game, mirror your phone to your mac. 

Run `python new_game.py` to update the site right before the game.
Run `python hq.py` to take a screenshot of the question and google it for answers
Run `python game_over.py` to return the site to it's inactive state.

Enjoy!

## Get in Touch

jakemny@gmail.com
www.jakemor.com
