// ==UserScript==
// @name           Nifty Chat Monitor, Road-hog123 Customised, with cheetojack changes
// @namespace      https://roadhog123.co.uk/
// @description    inlines Images, GIPHY GIFs, YouTube Thumbnails and Tweets in Twitch chat
// @match          https://www.twitch.tv/*
// @version        0.307-RHB-J
// @updateURL      https://raw.githubusercontent.com/jack-d-watson/significantly-less-nifty-chat/master/chat-monitor.user.js
// @downloadURL    https://raw.githubusercontent.com/jack-d-watson/significantly-less-nifty-chat/master/chat-monitor.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require        https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant          GM_log
// ==/UserScript==

var MESSAGE_CONTAINER = ".chat-scrollable-area__message-container";
waitForKeyElements(MESSAGE_CONTAINER, onChatLoad);
var twitterScript = document.createElement("script");
twitterScript.type = "text/javascript";
twitterScript.src = "https://platform.twitter.com/widgets.js";
document.body.appendChild(twitterScript);

const usersToHighlight = [
    "CHEETOJACK",
    "BIDBOT"
]

function onChatLoad() {
  // The node to be monitored
  var target = document.querySelector(MESSAGE_CONTAINER);

  // Create an observer instance
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Get list of new nodes
      var newNodes = mutation.addedNodes;

      // Check if there are new nodes added
      if (newNodes == null) {
        return;
      }

      newNodes.forEach(function(newNode) {
        if (newNode.nodeType !== Node.ELEMENT_NODE) {
          return;
        }

        // Only treat chat messages
        if (!newNode.classList.contains("chat-line__message")) {
          return;
        }

        newNode.querySelectorAll("span.text-fragment")
          .forEach(function(message) {
            if(hasBidHighlight(message.textContent)) {
              highlightMessage(newNode);
              return;
            }
          });

        newNode.querySelectorAll("span.chat-author__display-name")
          .forEach(function(user) {
             if(isFromHighlightedUser(user.textContent)) {
               highlightMessage(newNode);
               return;
             }
          });

        //add inline images
        newNode.querySelectorAll(".chat-line__message a.link-fragment")
          .forEach(function(link) {
            let imageLink = getImageLink(link.href);
            if (imageLink) {
              linkImage(link.parentNode, imageLink);
              return;
            }
            let videoLink = getVideoLink(link.href);
            if (videoLink) {
              linkVideo(link.parentNode, videoLink);
              return;
            }
            let giphyLink = getGiphyLink(link.href);
            if (giphyLink) {
              linkImage(link.parentNode, giphyLink);
              return;
            }
            let thumbnailLink = getYouTubeLink(link.href);
            if (thumbnailLink) {
              linkImage(link.parentNode, thumbnailLink);
              return;
            }
            let twitterID = getTweetID(link.href);
            if (twitterID) {
              linkTwitter(link.parentNode, twitterID);
              return;
            }
          });
      });
    });
  });

  // Pass in the target node, as well as the observer options
  observer.observe(target, {childList: true});
}

function hasBidHighlight(text) {
  return text.startsWith("!bid");
}

function isFromHighlightedUser(message) {
  return usersToHighlight.includes(message.toUpperCase())
}

function highlightMessage(node) {
  node.style = "background-color: #7394bf; color: #2a002a; font-weight: bold;";
  console.log("node highlighted");
}

function getImageLink(url) {
  let match = /.*\.(?:jpe?g|png|gif)(?:\?.*)?$/gim.exec(url);
  return ((match) ? match[0] : "").replace("media.giphy.com", "media1.giphy.com");
}

function getVideoLink(url) {
  let match = /.*\.(?:mp4)(?:\?.*)?$/gim.exec(url);
  return ((match) ? match[0] : "");
}

function getGiphyLink(url) {
  let match = /^https?:\/\/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)$/gm.exec(url);
  return ((match) ? "https://media1.giphy.com/media/" + match[1] + "/giphy.gif" : "");
}

function getYouTubeLink(url) {
  let match = /^https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+).*$/gm.exec(url);
  return ((match) ? "https://img.youtube.com/vi/" + match[1] + "/mqdefault.jpg" : "");
}

function getTweetID(url) {
  let match = /^https?:\/\/(?:www\.)?twitter\.com.+\/([0-9]+)(?:\?.*)?$/gm.exec(url);
  return ((match) ? match[1] : "");
}

function linkImage(node, imageURL) {
  var image = document.createElement("img");
  node.appendChild(image);
  image.style.display = "none";
  image.style.maxWidth = "100%";
  image.style.maxHeight = "50vh";
  image.style.margin = "0.25em auto 0";
  image.src = imageURL;
  image.addEventListener("load", function() {image.style.display = "block"})
}

function linkVideo(node, videoURL) {
  var video = document.createElement("video");
  node.appendChild(video);
  video.style.display = "none";
  video.style.maxWidth = "100%";
  video.style.maxHeight = "50vh";
  video.style.margin = "0.25em auto 0";
  video.src = videoURL;
  video.autoplay = video.loop = video.muted = true;
  video.addEventListener("canplay", function() {video.style.display = "block"});
}

function linkTwitter(node, tweetID) {
  twttr.widgets
    .createTweet(tweetID, node, {theme: "dark", conversation: "hidden", cards: "hidden"})
    .catch(e => console.log(e));
}
