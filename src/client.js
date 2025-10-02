
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

function addMessage(message, isUser=true) {
  const msgDiv=document.createElement("div");

  msgDiv.className = `flex ${
   isUser ? "justify-end" : "justify-start"
  }`;

  msgDiv.innerHTML = `
  <div class ="max-w-[70%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
   isUser
   ? "bg-blue-500 text-white rounded-br-none"
   : "bg-gray-200 text-gray-900 rounded-bl-none"
   }">
   ${message } 
   </div>
   `;

   chatDisplay.appendChild(msgDiv);
   chatDisplay.scrollTop= chatDisplay.scrollHeight;

   return msgDiv;
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
    const cursor = msgStream.parentElement.querySelector('.cursor');
    if (cursor) cursor.remove();
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
    // Try to parse as JSON first
    messageData = JSON.parse(event.data);
  } catch {
    // If not JSON, treat as regular message
    messageData = { data: event.data };
  }
  
  // Handle different message types
  if (messageData.type === "modelSelected") {
    // Don't show this as a chat message, just log it
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



