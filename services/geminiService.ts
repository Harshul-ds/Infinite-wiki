/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI} from '@google/genai';

// This check is for development-time feedback.
if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

// The "!" asserts API_KEY is non-null after the check.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
const artModelName = 'gemini-2.5-flash';
const textModelName = 'gemini-2.5-flash-lite';
/**
 * Art-direction toggle for ASCII art generation.
 * `true`: Slower, higher-quality results (allows the model to "think").
 * `false`: Faster, potentially lower-quality results (skips thinking).
 */
const ENABLE_THINKING_FOR_ASCII_ART = false;

/**
 * Art-direction toggle for blocky ASCII text generation.
 * `true`: Generates both creative art and blocky text for the topic name.
 * `false`: Generates only the creative ASCII art.
 */
const ENABLE_ASCII_TEXT_GENERATION = false;

export interface AsciiArtData {
  art: string;
  text?: string; // Text is now optional
}

export interface DefinitionData {
  type: 'definition';
  summary: string;
  key_concepts: { title: string; description: string }[];
}

export interface ComparisonData {
  type: 'comparison';
  topicA: string;
  topicB: string;
  introduction: string;
  similarities: { title: string; description: string }[];
  differences: { title: string; description: string }[];
  conclusion: string;
}

export interface Meaning {
  title: string;
  description: string;
}

export interface AmbiguityData {
  is_ambiguous: boolean;
  meanings?: Meaning[];
}

/**
 * Checks if a given topic is ambiguous and provides different meanings if so.
 * @param topic The word or term to check.
 * @param temperature A value from 0.0 to 1.0 controlling the randomness of the output.
 * @returns A promise that resolves to an ambiguity data object.
 */
export async function checkForAmbiguity(topic: string, temperature: number): Promise<AmbiguityData> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured.');
  }

  const prompt = `Is the term "${topic}" ambiguous? A term is ambiguous if it has multiple, distinct, well-known meanings (e.g., "stock" as in finance vs. inventory). A term is not ambiguous if it's a specific concept, even if complex.

Respond in JSON format with the following structure:
- If the term is ambiguous: {"is_ambiguous": true, "meanings": [{"title": "Title for Meaning 1", "description": "Brief description of meaning 1."}, ...]}
- If the term is NOT ambiguous: {"is_ambiguous": false}

The "title" for each meaning should be a more specific search term. For example, for "stock", a title could be "Stock (finance)".

Return ONLY the raw JSON object. Do not include markdown fences or any other text.`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: temperature,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonStr = response.text.trim();
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
    }
    const data = JSON.parse(jsonStr) as AmbiguityData;

    if (typeof data.is_ambiguous !== 'boolean') {
      throw new Error('JSON response is missing required "is_ambiguous" field.');
    }

    return data;
  } catch (error) {
    console.error(`Error checking ambiguity for "${topic}":`, error);
    // On error, assume it's not ambiguous to allow normal flow.
    return { is_ambiguous: false };
  }
}

/**
 * Generates a structured definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @param temperature A value from 0.0 to 1.0 controlling the randomness of the output.
 * @returns A promise that resolves to a structured definition object.
 */
export async function generateDefinition(topic: string, temperature: number): Promise<DefinitionData> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured. Please check your environment variables to continue.');
  }

  const prompt = `For the term "${topic}", generate a structured encyclopedia-style entry in JSON format. The JSON object must adhere to this structure:

{
  "summary": "A concise, single-paragraph summary of the topic. This should be engaging and informative, providing a clear overview.",
  "key_concepts": [
    {
      "title": "Concept Title",
      "description": "A detailed explanation of a core concept related to the topic."
    }
  ]
}

- The "summary" must be a single string.
- "key_concepts" must be an array of 2-3 objects, each with a "title" string and a "description" string.
- IMPORTANT: Preserve all special characters, mathematical notations, and exponents (e.g., ensure "m/s^2" is not simplified to "m/s"). The output must be accurate and suitable for a technical audience.

Return ONLY the raw JSON object. Do not include markdown fences or any other text outside the JSON structure. The response must start with "{" and end with "}".`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: temperature,
        // Disable thinking for the lowest possible latency.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonStr = response.text.trim();
    // A simple validation
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
    }
    const data = JSON.parse(jsonStr);
    
    // More validation
    if (!data.summary || !data.key_concepts) {
      throw new Error('JSON response is missing required fields.');
    }

    return { ...data, type: 'definition' };
  } catch (error) {
    console.error('Error generating definition from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    // Re-throwing allows the caller to handle the error state definitively.
    throw new Error(`Could not generate content for "${topic}". ${errorMessage}`);
  }
}

/**
 * Generates a structured comparison between two topics.
 * @param topicA The first topic.
 * @param topicB The second topic.
 * @param temperature A value from 0.0 to 1.0 controlling the randomness of the output.
 * @returns A promise that resolves to a structured comparison object.
 */
export async function generateComparison(topicA: string, topicB: string, temperature: number): Promise<ComparisonData> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured. Please check your environment variables to continue.');
  }

  const prompt = `For the terms "${topicA}" and "${topicB}", generate a structured encyclopedia-style comparison in JSON format. The JSON object must adhere to this structure:

{
  "introduction": "A concise, single-paragraph introduction to the comparison between the two topics.",
  "similarities": [
    {
      "title": "Shared Concept Title",
      "description": "A detailed explanation of a core concept the topics share."
    }
  ],
  "differences": [
    {
      "title": "Contrasting Concept Title",
      "description": "A detailed explanation of a core concept where the topics differ."
    }
  ],
  "conclusion": "A single-paragraph conclusion summarizing the relationship and significance of comparing these topics."
}

- "introduction" and "conclusion" must be single strings.
- "similarities" and "differences" must be arrays of 2-3 objects, each with a "title" string and a "description" string.
- IMPORTANT: Preserve all special characters, mathematical notations, and exponents. The output must be accurate and suitable for a technical audience.

Return ONLY the raw JSON object. Do not include markdown fences or any other text outside the JSON structure. The response must start with "{" and end with "}".`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: temperature,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonStr = response.text.trim();
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
    }
    const data = JSON.parse(jsonStr);

    if (!data.introduction || !data.similarities || !data.differences || !data.conclusion) {
      throw new Error('JSON response is missing required fields.');
    }

    return {
      ...data,
      type: 'comparison',
      topicA,
      topicB,
    };
  } catch (error) {
    console.error('Error generating comparison from Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not generate comparison for "${topicA}" vs "${topicB}". ${errorMessage}`);
  }
}


/**
 * Generates a single random word or concept using the Gemini API.
 * @returns A promise that resolves to a single random word.
 */
export async function getRandomWord(): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured.');
  }

  const prompt = `Generate a single, random, interesting English word or a two-word concept. It can be a noun, verb, adjective, or a proper noun. Respond with only the word or concept itself, with no extra text, punctuation, or formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for low latency.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text.trim();
// FIX: Added curly braces to the catch block to fix syntax error.
  } catch (error) {
    console.error('Error getting random word from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not get random word: ${errorMessage}`);
  }
}

/**
 * Generates ASCII art and optionally text for a given topic.
 * @param topic The topic to generate art for.
 * @returns A promise that resolves to an object with art and optional text.
 */
export async function generateAsciiArt(topic: string): Promise<AsciiArtData> {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured.');
  }
  
  const artPromptPart = `1. "art": meta ASCII visualization of the word "${topic}":
  - Palette: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|║═╔╗╚╝╠╣╦╩╬▞▟▙▚▜※≈~≡§¤°·…
  - Shape mirrors concept - make the visual form embody the word's essence
  - Examples: 
    * "explosion" → radiating lines from center
    * "hierarchy" → pyramid structure
    * "flow" → curved directional lines
  - Return as single string with \n for line breaks`;


  const keysDescription = `one key: "art"`;
  const promptBody = artPromptPart;

  const prompt = `For "${topic}", create a JSON object with ${keysDescription}.
${promptBody}

Return ONLY the raw JSON object, no additional text. The response must start with "{" and end with "}" and contain only the art property.`;

  const maxRetries = 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // FIX: Construct config object conditionally to avoid spreading a boolean
      const config: any = {
        responseMimeType: 'application/json',
      };
      if (!ENABLE_THINKING_FOR_ASCII_ART) {
        config.thinkingConfig = { thinkingBudget: 0 };
      }

      const response = await ai.models.generateContent({
        model: artModelName,
        contents: prompt,
        config: config,
      });

      let jsonStr = response.text.trim();
      
      // Debug logging
      console.log(`Attempt ${attempt}/${maxRetries} - Raw API response:`, jsonStr);
      
      // Remove any markdown code fences if present
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      // Ensure the string starts with { and ends with }
      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
      }

      const parsedData = JSON.parse(jsonStr) as AsciiArtData;
      
      // Validate the response structure
      if (typeof parsedData.art !== 'string' || parsedData.art.trim().length === 0) {
        throw new Error('Invalid or empty ASCII art in response');
      }
      
      // If we get here, the validation passed
      const result: AsciiArtData = {
        art: parsedData.art,
      };

      if (ENABLE_ASCII_TEXT_GENERATION && parsedData.text) {
        result.text = parsedData.text;
      }
      
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed for ASCII art generation');
        throw new Error(`Could not generate ASCII art after ${maxRetries} attempts: ${lastError.message}`);
      }
      // Continue to next attempt
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('All retry attempts failed');
}