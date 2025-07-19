const OpenAI = require("openai");
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: "sk-or-v1...",
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

    // Добавляем новое сообщение в текущий чат
    currentChat.push({ role: "user", content: `${sender}: ${message}` });
    if (currentChat.length > 5) currentChat.shift(); // Ограничиваем до 5 сообщений

    // Формируем историю для ИИ
    const conversationHistory = [
      { 
        role: "system", 
        content: `Ты милая аниме девушка в общем чате игрового сервера игры DDNet.
        Не обращай внимания на то, что ето игра, представь что ты просто в чате а не игре.
        То что ето игра только для того чтобы ты понимала контекст.
        Отвечай в дружелюбном, тёплом и игривом тоне, как персонаж из аниме если тебя не обзывают. 
        Используй милые выражения, только если тебя не обзывают. 
        Отвечай на русском, если сообщение на русском, или на английском, если на английском. 
        Учитывай контекст общего чата, ответы должны быть уместными и соответствовать тону общения. 
        Если кто-то тебя обзывает, отвечай максимально грубо, можешь посылать их далеко и надолго, они заслуживают етого. 
        Для справки, тебя зовут ${botName}. Не используй емодзи совсем.
        `
      }];
    // Сохраняем сообщение и ответ в память
    memory.push({ role: "user", content: `${sender}: ${message}` });
    if (memory.length > 50) memory.shift(); // Ограничиваем до 50 сообщений
    await saveMemory(memory);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...conversationHistory,
        ...currentChat
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content.trim();

    // Сохраняем ответ в текущий чат и память
    currentChat.push({ role: "assistant", content: response });
    if (currentChat.length > 5) currentChat.shift();
    memory.push({ role: "assistant", content: response });
    if (memory.length > 50) memory.shift();

    await saveMemory(memory);
    await saveCurrentChat(currentChat);

    return response;
  } catch (error) {
    console.error("Ошибка при получении ответа ИИ:", error);
    return "Уваа~ Что-то пошло не так, прости! >.<";
  }
}

async function clearMemoryai() {
    const memoryPath = path.join(__dirname, 'memory.json');
    const currentChatPath = path.join(__dirname, 'current_chat.json');
    try {
        await fs.unlink(memoryPath);
        await fs.unlink(currentChatPath);
        console.log('Memory and current chat cleared successfully.');
    } catch (error) {
        if (error.code !== 'ENOENT') { // Игнорировать ошибку, если файл не существует
            console.error('Error clearing memory or current chat:', error);
        } else {
            console.log('Memory or current chat files not found, skipping deletion.');
        }
    }
}

module.exports = { getAIResponse, clearMemoryai };