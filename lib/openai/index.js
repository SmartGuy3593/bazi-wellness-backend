const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const constructPrompt = (details) => {
  return `
    Based on the following data:

      ${JSON.stringify(details)}
    
    Please provide insights and advice for the person on this date, focusing on how the day's energies interact with the person's BaZi. Consider any clashes, favorable elements, and other significant factors.
    `.trim();
};

const overviewPrompt = (details) => {
  return `
    This is User's Natal Bazi chart:
    //

    //
    Generate Profile Overview like this:
    //
    Your Birth Info

Your Natal Bazi

    Year Pillar: Yang Wood Dog
    Month Pillar: Yang Earth Dragon
    Day Pillar: Yang Earth Tiger
    Hour Pillar: Yin Wood Rabbit

Notable Features:

    Day Master: Yang Earth (stable, foundation-building qualities)
    Double Yang Earth appearance (Month and Day)
    Double Wood influence (Year and Hour)
    Strong Yang energy predominance

Core Nature: Domain Commander

Like a mountain that provides both shelter and resources, your Yang Earth Day Master demonstrates remarkable ability to create strong foundations while supporting growth. The double Earth influence amplifies your natural capacity for stability and reliable support. Think of yourself as a mighty plateau – you have an innate gift for building platforms where others can flourish while maintaining strength and dignity.

The Wood presence adds vitality to your stable nature, like trees growing strong on mountainsides. This combination helps you know when to provide firm support and when to show flexibility.
Natural Gifts

Your chart reveals several key strengths:

    Exceptional ability to create stable foundations
    Natural talent for sustained leadership
    Strong capacity for reliable support
    Ability to maintain stability under pressure
    Skill at building lasting structures

The double Earth influence suggests you excel at creating strong, dependable support systems. Your Wood influences enhance your ability to foster growth while maintaining stability.
Growth Opportunities

Your energy pattern shows a Resource-Rich Pattern, indicating that you have strong internal resources and natural confidence in your approach. To optimize your natural patterns:

    Practice balancing strength with flexibility
    Develop ways to sustain your supportive energy
    Learn to recognize when to be firm and when to adapt
    Balance your building nature with openness to change
    Cultivate relationships that appreciate your steady presence

Working With Your Energy

To make the most of your natural patterns:

Optimal Timing:

    Schedule important decisions during earth hours
    Use morning hours for foundation building and afternoon for maintenance
    Allow regular periods for grounding

Environmental Recommendations:

    Create spaces that combine stability with vitality
    Include elements that promote both strength and growth
    Ensure access to both structured and open spaces

Application Strategies:

    Lead through steady example
    Use your natural stability to support growth
    Create systems that maintain reliability
    Build in regular periods for reinforcement
    Leverage your ability to provide strong foundations

Your Bazi chart reveals a person with exceptional gifts for creating stable foundations and providing reliable support, while maintaining strength and effectiveness. By understanding and working with these patterns, you can maximize your natural strengths while developing in areas that support your core nature.

    //
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
  overviewPrompt,
  getAnthropicResponse,
  getOpenaiResponse,
};