Demo: 
https://sleepy-mountain-8012.herokuapp.com/admin
https://sleepy-mountain-8012.herokuapp.com/run/test

# peterson-lab
Study-runner for showing video a stimulus and taking survey responses. Intended for use on amazon's mechanical turk. 

Written with the MEAN stack. Employs Amazon S3 cloud for video hosting and Google Drive for image and long-term data storage. 

#TO DO

##UI design
- center all text and video
- layout elements nicely
- show users a "Please use a larger screen" page when screen is too small. (Can that be done with css only?)
- determine physical dimensions for the app that will allow it to be the same size on most desktop or laptop screens.


##Admin Page
- The "active" checkbox on the study management pane needs to be able to prevent the running of studies that are inactive
- ~~The admin password box should be obfuscated~~
- controls need to be put on the inputs to prevent things like duplicate studies and duplicate shares
- when an item in a row's table is clicked it should set that field into edit mode. Change the new/delete button to a save button.

##Study Run Page
###Calibration phase
- The participant number input could probably use some highlighting to indicate that it must be done.
  - maybe grey out the calibration phase until the participant has entered and submitted a valid participant number for the study

###Survey phase
- need larger text input field.
- a limiter for the length of the text that can be entered. Does not need a char counter but it might be nice.
- might need to add a feature to the Study Management pane so that an experminter can choose what the final survey question will be and maybe add a second question.

##Compatibility
- Browser priority: Chrome, Firefox, IE, Edge?
- Chrome works, Firefox needs a little work. IE is probably not worth it because it will require flash for the A/V
- Need to check the user's browser type and inform them that the app will not work with their browser.

##Security
- AWS files are open access. Could result in unwarranted access => charges

##Unexpected User Behaviour Handling
- prevent user from restarting app once they have begun
thankyou
    redirect option
