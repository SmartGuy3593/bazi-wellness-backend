const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const constructPrompt = (details) => {
  return `
    Based on the following data:

    ${details}
    
    Please provide insights and advice for the person on this date, focusing on how the day's energies interact with the person's BaZi. Consider any clashes, favorable elements, and other significant factors.
    `.trim();
};

const getAnthropicResponse = async (prompt) => {
  try {
    const response = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are an expert in Chinese metaphysics and Bazi analysis.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    return response.content[0].text.trim();
  } catch (error) {
    return `Error in Anthropic API call: ${error.message}`;
  }
};

const getOpenaiResponse = async (prompt) => {
  try {
    const response = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert in Chinese metaphysics and BaZi analysis." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      n: 1,
    });
    return response.choices[0].message.content;
  } catch (error) {
    return `Error in OpenAI API call: ${error.message}`;
  }
};

module.exports = { 
  constructPrompt,
  getAnthropicResponse,
  getOpenaiResponse,
};