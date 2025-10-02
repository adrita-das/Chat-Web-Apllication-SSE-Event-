//* eslint-env browser */

//@ts-nocheck
// Optional JS type checking, powered by TypeScript.
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */
/** @typedef {import("partykit/server").Connection} Connection */
/** @typedef {import("partykit/server").ConnectionContext} ConnectionContext */

export default {
  async onConnect(connection, room) {
    console.log("Client connected:", connection.id);
  },

  async onMessage(message, connection, room) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const userMsg = message.toString().trim();

    if (!userMsg) {
      connection.send("Please send a message.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(userMsg);
    } catch {
      parsed = null;
    }

    // Handle model selection
    if (parsed && parsed.type === "selectModel") {
      // Store in PartyKit's persistent storage
      await room.storage.put(`model_${connection.id}`, parsed.model);

      connection.send(JSON.stringify({
        type: "modelSelected",
        model: parsed.model
      }));
      return;
    }

    // chat message & streaming 
    try {
      const selectedModel = await room.storage.get(`model_${connection.id}`);
      
      if (!selectedModel || selectedModel === "")  {
        connection.send("Please select a model first.");
        return;
      }

      // Send streaming start indicator
      connection.send(JSON.stringify({
        type: "streamStart"
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:1999",
          "X-Title": "Partykit Chat Bot",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: userMsg}],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error:", response.status, errText);
        connection.send(JSON.stringify({
          type: "error",
          message: `API Error: ${response.status} - ${errText}`
        }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;
            
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Send stream end indicator
                connection.send(JSON.stringify({
                  type: "streamEnd"
                }));
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  console.log(content); // Keep server log
                  
                  // Send content chunk to client - THIS IS THE KEY PART
                  connection.send(JSON.stringify({
                    type: "streamChunk",
                    content: content
                  }));
                }
              } catch (e) {
                // Ignore invalid JSON
                console.warn("Failed to parse streaming chunk:", e);
              }
            }
          }
        }
      } finally {
        reader.cancel();
      }

    } catch (err) {
      console.error("API error:", err);
      connection.send(JSON.stringify({
        type: "error",
        message: "Failed to get reply from model."
      }));
    }
  }
}