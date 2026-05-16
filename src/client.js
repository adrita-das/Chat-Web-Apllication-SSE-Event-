//Environment  & Imports  
// start
/* eslint-env browser */
/* global PARTYKIT_HOST */
//@ts-nocheck

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  'supabase_url',
  'supabase_annon_key'
)

// 🆕 ADDED: state for DB
let currentConvId = null
let currentUser = null
let fullReply = ""


import PartySocket from "partysocket";

//connect to PartyKit server
const socket = new PartySocket({
  host:PARTYKIT_HOST,
  room:"chat-room",
});

//document id 
const dropdownToggle = document.getElementById("dropdownToggle");
const dropdownMenu = document.getElementById("dropdownMenu");
const chatDisplay = document.getElementById("chat-display");
const chatText = document.getElementById("chat-text");
const sendButton = document.getElementById("send-button");


const convList   = document.getElementById("conversation-list")
const newChatBtn = document.getElementById("new-chat-btn")
const logoutBtn  = document.getElementById("logout-btn")



// ================= USER PROFILE =================

// replaced hardcoded email — now comes from Supabase session
let userEmail = ""

// color generator — YOUR ORIGINAL, unchanged
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


function getInitial(email) {
  return email ? email.charAt(0).toUpperCase() : "U";
}


function setUserProfile(email) {
  const userInitial = document.getElementById("user-initial");
  const userEmailText = document.getElementById("user-email");

  if (!userInitial || !userEmailText) {
    console.error("Profile elements not found!");
    return;
  }

  const avatar = userInitial.parentElement;
  userInitial.textContent = getInitial(email);
  avatar.className = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  avatar.classList.add(getProfile(email));
  userEmailText.textContent = email;
}


supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = "/login.html"
    return
  }
  currentUser = session.user
  userEmail   = currentUser.email
  setUserProfile(userEmail)
  loadConversations()
})


if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut()
    window.location.href = "/login.html"
  })
}


if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    currentConvId = null
    document.querySelectorAll("#conversation-list [data-id]").forEach(el => {
      el.classList.remove("bg-white/10")
    })
    chatDisplay.innerHTML = ""
  })
}

async function loadConversations() {
  const { data } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(40)

  document.getElementById("conv-loading")?.remove()

  if (!data?.length) {
    convList.innerHTML = '<p class="text-slate-600 text-xs text-center py-4">No chats yet</p>'
    return
  }
  data.forEach(conv => addConvToSidebar(conv))
}

function addConvToSidebar(conv) {
  convList.querySelector("p")?.remove()

  const el = document.createElement("div")
  el.dataset.id  = conv.id
  el.className   = "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 text-slate-300 text-xs transition-colors"
  el.innerHTML   = `
    <i class="fas fa-comment text-slate-600 text-xs flex-shrink-0"></i>
    <span class="flex-1 truncate">${conv.title}</span>
    <button class="del-btn opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs px-1 transition-colors">
      <i class="fas fa-trash"></i>
    </button>
  `

  el.addEventListener("click", (e) => {
    if (e.target.closest(".del-btn")) return
    openConversation(conv.id)
  })

  el.querySelector(".del-btn").addEventListener("click", async (e) => {
    e.stopPropagation()
    await supabase.from("conversations").delete().eq("id", conv.id)
    el.remove()
    if (currentConvId === conv.id) { currentConvId = null; chatDisplay.innerHTML = "" }
  })

  convList.prepend(el)
}

async function openConversation(convId) {
  currentConvId = convId
  document.querySelectorAll("#conversation-list [data-id]").forEach(el => {
    el.classList.toggle("bg-white/10", el.dataset.id === convId)
  })
  chatDisplay.innerHTML = ""

  const { data } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })

  data?.forEach(msg => addMessage(msg.content, msg.role === "user"))
}


//handle dropdown menu start — YOUR ORIGINAL, unchanged
dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add("hidden");
  }
});

const dropdownItems = dropdownMenu.querySelectorAll("a");
dropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    dropdownToggle.childNodes[0].textContent = item.textContent.trim();
    dropdownMenu.classList.add("hidden");
  });
});

document.querySelectorAll("[data-model]").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const selectedModel = item.getAttribute("data-model");
    console.log("Selected Model:", selectedModel);
    const buttonTextNode = dropdownToggle.childNodes[0];
    buttonTextNode.textContent = item.textContent.trim();
    socket.send(JSON.stringify({
      type: "selectModel",
      model: selectedModel
    }));
  });
});
//handle dropdown menu end

let msgStream = null;

function addMessage(message, isUser = true) {
  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
    isUser
      ? "bg-blue-500 text-white rounded-br-none"
      : "bg-gray-200 text-gray-900 rounded-bl-none"
  }`;
  bubble.textContent = message;

  const avatar = document.createElement("div");
  avatar.className = "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold";

  if (isUser) {
    avatar.classList.add(getProfile(userEmail || "a"));
    avatar.textContent = getInitial(userEmail || "U");
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


// streaming — YOUR ORIGINAL, unchanged
function streamingStart() {
  fullReply = "" // 🆕 reset for new reply
  const msgDiv = document.createElement("div");
  msgDiv.className = "flex justify-start";
  msgDiv.innerHTML = `
    <div class="max-w-[75%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap bg-gray-200 text-gray-800 rounded-bl-none">
      <span class="streaming-chat"></span><span class="indicator-start animate-pulse">...</span>
    </div>
  `;
  chatDisplay.appendChild(msgDiv);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
  msgStream = msgDiv.querySelector(".streaming-chat");
  return msgDiv;
}

function updateStreaming(content) {
  if (msgStream) {
    fullReply += content // 🆕 accumulate reply
    msgStream.textContent += content;
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }
}

function endStreaming() {
  if (msgStream) {
    const indicator = msgStream.parentElement.querySelector('.indicator-start');
    if (indicator) indicator.remove();
    msgStream = null;
  }

  if (currentConvId && fullReply) {
    supabase.from("messages").insert({
      conversation_id: currentConvId,
      role: "assistant",
      content: fullReply
    })
  }

}

// send button 
sendButton.addEventListener("click", async () => {
  const userMsg = chatText.value.trim();
  if (!userMsg) return;
  addMessage(userMsg, true);
  chatText.value = "";


  if (currentUser) {
    if (!currentConvId) {
      const title = userMsg.length > 40 ? userMsg.slice(0, 40) + "…" : userMsg
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: currentUser.id, title })
        .select().single()
      if (data) {
        currentConvId = data.id
        addConvToSidebar(data)
        document.querySelectorAll("#conversation-list [data-id]").forEach(el => {
          el.classList.toggle("bg-white/10", el.dataset.id === data.id)
        })
      }
    }
    if (currentConvId) {
      supabase.from("messages").insert({
        conversation_id: currentConvId,
        role: "user",
        content: userMsg
      })
    }
  }


  socket.send(userMsg);
});

// keyboard handler 
chatText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendButton.click();
});


// receive messages 
socket.addEventListener("message", (event) => {
  let messageData;
  try {
    messageData = JSON.parse(event.data);
  } catch {
    messageData = { data: event.data };
  }

  if (messageData.type === "modelSelected") {
    console.log("Model confirmed:", messageData.model);
    return;
  }

  if (messageData.type === "streamStart") { streamingStart(); }
  else if (messageData.type === "streamChunk") { updateStreaming(messageData.content); }
  else if (messageData.type === "streamEnd") { console.log("End stream"); endStreaming(); }
  else if (messageData.type === "error") { addMessage(`Error : ${messageData.message}`, false); endStreaming(); }
  else { addMessage(messageData.data || event.data, false); }
});