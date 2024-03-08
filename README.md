# KoiiTech
Problem statement : 
The goal is to write a web scrapper via Node.JS and puppeteer, that will be taking the first entry of every forum post, and storing them in a MongoDB database without duplicates.

Source website: (https://forums.redflagdeals.com/hot-deals-f9/)

## Working flow of the project 
1) install node modules - npm install
2) start the script - npm start

## Pre-requisite : 
- Data is stored in local mongoDB, database name : Koii

## Notes : 
- Might need to do "npm start" twice as the first time it gets stuck on the first forum page and exceeds the time for buffer, should work fine after hitting npm start again.                                                                     
