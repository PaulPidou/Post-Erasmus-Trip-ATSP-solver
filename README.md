# Post Erasmus Trip (ATSP solver)

This project aims to help former Erasmus students (or travellers in general) to schedule their next trips across the world.
You can see it working here : http://www.paul-pidou.name/projects/post-erasmus/erasmus-trip.html

### Usage
To add location to visit, you simply have to search for it thanks to the input field and clic on the place you want on the list. Once added, a place can be set as start and/or end point of the trip or it can be removed. You can choose between two modes: car or transit.

#### Car mode

By selecting the car mode, you would be able to select if you want avoid highways and/or tolls thanks to the dropdown menu. Once you have added the places you want to visit, just clic on 'Go' and the fatest road will be automatically displayed after few seconds.

#### Transit mode

In the transit mode, once you have added the places you want to visit, just clic on 'Go' and it will automatically displayed three tabs after few seconds. The tabs contains the cheapest, fatest and shortest roads found. The prices displayed are just indicative!

### More details
You can obtain more details about a specific road just by clicking on the corresponding summary.

## Under the hood

This project was mainly for me the occasion to play around with the Asymmetric Traveling Salesman Problem (ATSP).
I solved it thanks to the simulated annealing technique (you can find the code in the atsp.js file)

### Design

The design is mainly coming for the Twitter Bootstrap framework

### APIs used

I used the Google Maps and the Rome2rio APIs.

## How to use on your computer

As this tool is completely javascript powered you can simply download it and launch it in your browser.
You just have to request for API Keys to Google Map (https://developers.google.com/maps/signup) and to Rome2rio (http://www.rome2rio.com/documentation).
Once obtained just replace the '[API-KEY]' tag in the erasmus-trip.html file by you Google Map API key and the '[API-KEY]' tag in the handleAPI.js file by your Rome2rio API key.

“There are no foreign lands. It is the traveler only who is foreign.” – Robert Louis Stevenson
