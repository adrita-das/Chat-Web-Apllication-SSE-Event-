//* eslint-env browser */
//@ts-nocheck
// Optional JS type checking, powered by TypeScript.
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */
/** @typedef {import("partykit/server").Connection} Connection */
/** @typedef {import("partykit/server").ConnectionContext} ConnectionContext */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export default {
  async onConnect(connection, room) {
    console.log("Client connected:", connection.id);
  },

  async onMessage(message, connection, room) {
    const apiKey = process.env.OPENAI_API_KEY;
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
      await room.storage.put(`model_${connection.id}`, parsed.model);

      connection.send(JSON.stringify({
        type: "modelSelected",
        model: parsed.model
      }));
      return;
    }

    try {
      const selectedModel = await room.storage.get(`model_${connection.id}`);
      
      if (!selectedModel || selectedModel === "") {
        connection.send("Please select a model first.");
        return;
      }

      // Send streaming start indicator
      connection.send(JSON.stringify({
        type: "streamStart"
      }));

      // FIXED: Correct ChatOpenAI initialization
      const chatModel = new ChatOpenAI({
        model: selectedModel,  
        temperature: 0.8,
        streaming: true,
        openAIApiKey: apiKey,  
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'http://localhost:1999',
            'X-Title': 'Partykit Chat Bot',
          }
        }
      });
      
      const messages = [new HumanMessage(userMsg)];

      // Stream the response
      const stream = await chatModel.stream(messages);

      for await (const chunk of stream) {
        const content = chunk.content;
        
        if (content) {
          connection.send(JSON.stringify({
            type: "streamChunk",
            content: content
          }));
        }
      }

      // Send stream end
      connection.send(JSON.stringify({
        type: "streamEnd"
      }));

    } catch (err) {
      console.error("API error:", err);
      connection.send(JSON.stringify({
        type: "error",
        message: "Failed to get reply from model."
      }));
    }
  }
}