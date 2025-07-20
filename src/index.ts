import readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");

// Step 1: Fetch & summarize customer issues
const summarizeCustomerProblems = async () => {
  const interactions = await prisma.interaction.findMany();
  if (interactions.length === 0) {
    console.log("No customer issues found.");
    return "No customer problems in the database.";
  }
  const combinedText = interactions.map(i => i.callTranscribe + " " + i.supportTickets).join('\n');
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
  const result = await model.generateContent(`Summarize the main customer problems from this data:\n${combinedText}`);
  const response = await result.response.text();
  console.log("\n📝 Summary of Customer Problems:\n", response);
  return response;
};

// Step 2: Expose getData for function calling
const getData = async () => {
  const data = await prisma.interaction.findMany();
  return JSON.stringify(data, null, 2);
};

// Step 3: Start Chatbot
const startChatbot = async () => {
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
  const chat = model.startChat();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question("\n👤 You: ", async (userInput) => {
      // Catch non-DB queries like "Tell me a joke"
      const offTopic = ["joke", "weather", "quote", "news", "game", "movie", "music"];
      if (offTopic.some(word => userInput.toLowerCase().includes(word))) {
        console.log("🤖 Agent: I don't have access to that.");
        return ask();
      }

      // Run Gemini chat
      const result = await chat.sendMessage(userInput);
      const response = await result.response.text();

      // If Gemini suggests to get data from DB
      if (userInput.toLowerCase().includes("ticket") || userInput.toLowerCase().includes("issue")) {
        const dbData = await getData();
        console.log("📁 Data from DB:\n", dbData);
      }

      console.log("🤖 Agent:", response);
      ask();
    });
  };

  ask();
};

// Run Summary & Chat
(async () => {
  await summarizeCustomerProblems();
  await startChatbot();
})();
