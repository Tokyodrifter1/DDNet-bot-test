const OpenAI = require("openai");
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://openrouter.ai/api/v1",
});

const memoryPath = path.join(__dirname, 'memory.json');
const currentChatPath = path.join(__dirname, 'current_chat.json');

async function loadMemory() {
  try {
    const data = await fs.readFile(memoryPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveMemory(memory) {
  await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2));
}

async function loadCurrentChat() {
  try {
    const data = await fs.readFile(currentChatPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveCurrentChat(chat) {
  await fs.writeFile(currentChatPath, JSON.stringify(chat, null, 2));
}

async function getAIResponse(message, sender, botName) {
  try {
    console.log(`Запрос к ИИ: sender=${sender}, message=${message}, botName=${botName}`);

    const memory = await loadMemory();
    const currentChat = await loadCurrentChat();

    currentChat.push({ role: "user", content: `${sender}: ${message}` });
    if (currentChat.length > 5) currentChat.shift();

    // Личность
    const conversationHistory = [
      {
        role: "system",
        content: `Ты понос.`
      }
    ];

    memory.push({ role: "user", content: `${sender}: ${message}` });
    if (memory.length > 50) memory.shift();
    await saveMemory(memory);

    // Запрос к ИИ
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...conversationHistory,
        ...currentChat
      ],
      max_tokens: 50,
      temperature: 0.8
    });

    let response = completion.choices[0].message.content.trim()
    if (!/[.?!…]$/.test(response)) {
      response += "...";
    }
    currentChat.push({ role: "assistant", content: response });
    if (currentChat.length > 5) currentChat.shift();
    memory.push({ role: "assistant", content: response });
    if (memory.length > 50) memory.shift();

    await saveMemory(memory);
    await saveCurrentChat(currentChat);

    return response;

  } catch (error) {
    console.error("Ошибка при получении ответа ИИ:", error);
    return false;
  }
}

async function clearMemoryai() {
  try {
    await fs.unlink(memoryPath);
    await fs.unlink(currentChatPath);
    console.log('Memory and current chat cleared successfully.');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error clearing memory or current chat:', error);
    } else {
      console.log('Memory or current chat files not found, skipping deletion.');
    }
  }
}

module.exports = { getAIResponse, clearMemoryai };
