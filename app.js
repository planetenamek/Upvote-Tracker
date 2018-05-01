const steem = require("steem");
const fs = require("fs");
const config = require("./config.json");

const { nodes }  = require('./nodes');
const username = config.username;
const password = config.wif;
const trackedTag = config.trackedTag;
const trackedAccount = config.trackedAccount;

var index = 0

stream()

function savePost(author,permlink) {
  fs.readFile('post-saved.json', 'utf8', function readFileCallback(err, data){
    if (err){
      console.log(err);
    }else{
      obj = JSON.parse(data);
      if(typeof obj.selection[0] == "undefined") { id = 1} else { id = obj.selection.length + 1 }
        obj.selection.push({id: id, author:author, permlink:permlink});
        console.log("Enregistrement article n° " + obj.selection.length);
        json = JSON.stringify(obj);
        
        fs.writeFile('post-saved.json', json, 'utf8', function(){
          console.log("--------------- Enregistrement réussi --------------- ! ");
        }); 
      }
  });
}

// Broadcast votes
function vote(username, password, author, permlink, weight) {
  steem.broadcast.vote(password, username, author, permlink, weight, function(err, result) {
    console.log(err, result);
  });
}

// Send votes
function sendVote(author,permlink, weightVoter) {
  steem.api.getContent(author,permlink, function (err,res) {
    data = JSON.parse(res.json_metadata)
    tags = data.tags
    weight = config.weight

    if(weightVoter < 1000) {
	    weight = weight / 4
	    weight = parseInt(weight)
    }

    if(tags.indexOf(trackedTag) != (-1)){
      console.log("Bot send vote to " + author + " link = https://steemit.com/" + trackedTag + "/@" + author + "/" + permlink) 
      vote(username, password, author, permlink, weight);
    }
  });
}

function stream() {
    steem.api.setOptions({ url: nodes[index] });
    return new Promise((resolve, reject) => {
        console.log('Connected to ' + nodes[index]);
        steem.api.streamOperations((err, operation) => {
            if(err) return reject(err);
              if(operation[0] == "vote") {
                if(operation[1].voter == trackedAccount) {
                  sendVote(operation[1].author, operation[1].permlink, operation[1].weight);
                  savePost(operation[1].author,operation[1].permlink);
                }
              }
        });
    }).catch(err => {
        console.log('Stream error:', err.message, 'with', nodes[index]);
        index = ++index === nodes.length ? 0 : index;
        stream();
    });
}
