
//Environment  & Imports  
// start
/* eslint-env browser */
/* global PARTYKIT_HOST */
//@ts-nocheck

//import supabase from "./supabase"

import PartySocket from "partysocket";

//connect to PartyKit server

const socket = new PartySocket({
  host:PARTYKIT_HOST,
  room:"chat-room",
});

//documnet id 
const dropdownToggle = document.getElementById("dropdownToggle");
const dropdownMenu = document.getElementById("dropdownMenu");
const chatDisplay = document.getElementById("chat-display");
const chatText = document.getElementById("chat-text");
const sendButton = document.getElementById("send-button");


// ================= USER PROFILE =================

// 🔴 replace later with Supabase
const userEmail = "adrita@gmail.com";

// color generator
function getProfile(email) {
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  return colors[email.charCodeAt(0) % colors.length];
}

// first letter
function getInitial(email) {
  return email ? email.charAt(0).toUpperCase() : "U";
}

// set sidebar profile
function setUserProfile(email) {
  const userInitial = document.getElementById("user-initial");
  const userEmailText = document.getElementById("user-email");

  if (!userInitial || !userEmailText) {
    console.error("Profile elements not found!");
    return;
  }

  const avatar = userInitial.parentElement;

  userInitial.textContent = getInitial(email);

  avatar.className =
    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";

  avatar.classList.add(getProfile(email));

  userEmailText.textContent = email;
}

// run after DOM load
window.addEventListener("DOMContentLoaded", () => {
  setUserProfile(userEmail);
});

//handle dropdown menu start

// Toggle dropdown visibility & hidden the menu

dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent bubbling
  dropdownMenu.classList.toggle("hidden");
});


document.addEventListener("click", (e) => {
  if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add("hidden");
  }
});

// Add click event to each menu item

const dropdownItems = dropdownMenu.querySelectorAll("a");
dropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    dropdownToggle.childNodes[0].textContent = item.textContent.trim(); // update button text
    dropdownMenu.classList.add("hidden");
  });
});


//model choice

// Model selection handler 

document.querySelectorAll("[data-model]").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Get the model from data-model attribute

    const selectedModel = item.getAttribute("data-model");
    console.log("Selected Model:", selectedModel);
    
    // Update button text
    const buttonTextNode = dropdownToggle.childNodes[0];
    buttonTextNode.textContent = item.textContent.trim();
    
    // Send JSON to server 

    socket.send(JSON.stringify({
      type: "selectModel",
      model: selectedModel
    }));
    
  });

});

//handle dropdown menu end

// Send selected model to server after client chooses it
// function for clients model selection

function selectModel(dataModel) {
  socket.send(JSON.stringify({
    type: "selectModel",
    model: dataModel
  }));
}

//client select a model


//add message in chat window start

let msgStream = null;

function addMessage(message, isUser = true) {
  const wrapper = document.createElement("div");

  wrapper.className = `flex ${
    isUser ? "justify-end" : "justify-start"
  } items-end gap-2`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
    isUser
      ? "bg-blue-500 text-white rounded-br-none"
      : "bg-gray-200 text-gray-900 rounded-bl-none"
  }`;

  bubble.textContent = message;

  const avatar = document.createElement("div");
  avatar.className =
    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold";

  if (isUser) {
    avatar.classList.add(getProfile(userEmail));
    avatar.textContent = getInitial(userEmail);
  } else {
    avatar.classList.add("bg-gray-700");
    avatar.textContent = "AI";
  }

  if (isUser) {
    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  }

  chatDisplay.appendChild(wrapper);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}




//new function for streaming 

function streamingStart() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "flex justify-start";

  msgDiv.innerHTML = `
    <div class="max-w-[75%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap bg-gray-200 text-gray-800 rounded-bl-none">
      <span class="streaming-chat"></span><span class="indicator-start animate-pulse">...</span>
    </div>
  `;

chatDisplay.appendChild(msgDiv);
chatDisplay.scrollTop=chatDisplay.scrollHeight;

 msgStream = msgDiv.querySelector(".streaming-chat");
 return msgDiv;

}

//new function for streaming end

//update streaming start

function updateStreaming(content) {
  if(msgStream) {
    msgStream.textContent += content;
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }
}

//function end stream 

function endStreaming() {
  if(msgStream){
    const indicator = msgStream.parentElement.querySelector('.indicator-start');
    if (indicator) indicator.remove();
    msgStream = null;
  }
}


//add message in chat window start

//button handler 
sendButton.addEventListener("click" ,() =>{
  const userMsg  = chatText.value.trim();
  if(!userMsg) return;
  addMessage(userMsg, true);
  socket.send(userMsg);
  chatText.value="";

});

//keyboard handeler 
chatText.addEventListener("keydown" ,(e) =>{
  if(e.key === "Enter") sendButton.click();
});

//recive message  & reply  start
// Receive messages from server
socket.addEventListener("message", (event) => {
  let messageData;
  
  try {
    
    messageData = JSON.parse(event.data);
  } catch {
    // If not JSON, treat as regular message
    messageData = { data: event.data };
  }
  
  // Handle different message types
  if (messageData.type === "modelSelected") {
  
    console.log("Model confirmed:", messageData.model);
    //addMessage(`Model switched to: ${messageData.model}`, false);
    return;
  }

 if(messageData.type === "streamStart"){
  streamingStart();
  
 }
 else if(messageData.type === "streamChunk"){
  updateStreaming(messageData.content);
 }

 else if(messageData.type === "streamEnd"){
  console.log("End stream ");
  endStreaming()
 }

 else if(messageData.type === "error"){
  addMessage(`Error : ${messageData.message}` , false);
  endStreaming();
 }
 
 else{
  addMessage(messageData.data || event.data , false);
 }
  
});

//recive message  & reply  end 