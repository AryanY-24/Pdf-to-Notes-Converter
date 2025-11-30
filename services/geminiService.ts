import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProcessingOptions, NoteResult } from "../types";

// Schema for the structured output we want from Gemini
const noteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A suitable title for the notes based on the document content.",
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "The section heading (e.g., Introduction, Summary, or a specific Keyword topic).",
          },
          content: {
            type: Type.STRING,
            description: "The extracted or summarized content for this section.",
          },
        },
        required: ["heading", "content"],
      },
    },
    keywordsFound: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of relevant keywords or topics actually found and extracted from the text.",
    },
  },
  required: ["title", "sections", "keywordsFound"],
};

export const generateNotes = async (text: string, options: ProcessingOptions): Promise<NoteResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt based on user options
  let prompt = `You are an expert academic note-taker. Your task is to process the provided text from a PDF document and create structured, clean notes based on specific requirements.

    **Source Text:**
    ${text.substring(0, 30000)} ... (Text truncated if too long, focus on the available content)

    **Requirements:**
    1. **Preprocessing**: Ignore headers, footers, page numbers, and irrelevant noise in the source text.
    2. **Extraction & Summarization**:
    `;

  // Priority 1: Custom Keywords (Updated for strict contextual search)
  if (options.customKeywords && options.customKeywords.trim().length > 0) {
    prompt += `- **HIGHEST PRIORITY: Contextual Keyword Extraction**:
      - The user is specifically interested in these topics: "${options.customKeywords}".
      - **Deep Search**: You must read through the entire text to find mentions of these topics, regardless of the section they appear in.
      - **No Headers Required**: Do not expect standard headings for these topics. Extract content even if it's inside a paragraph with a generic heading like "Introduction" or "Discussion".
      - **Structure**: Create a distinct section for each user-provided topic/keyword and synthesize all relevant information found in the document into that section.
      - **Emphasis**: If the document discusses these topics, ensure they are the most detailed parts of the notes.\n`;
  }

  if (options.extractIntroduction) {
    prompt += `- Extract and summarize the **Introduction** section. Make it clear and concise.\n`;
  }
  if (options.extractSummary) {
    prompt += `- Extract the document's **Abstract** or **Executive Summary** if present.\n`;
  }
  if (options.extractConclusion) {
    prompt += `- Extract and summarize the **Conclusion** or **Future Scope** section.\n`;
  }

  prompt += `\n3. **Summarization Level**: The user requested a "${options.summarizationLevel}" summary. `;
  if (options.summarizationLevel === 'brief') {
    prompt += `Keep descriptions short and bulleted.`;
  } else {
    prompt += `Provide detailed paragraphs and comprehensive explanations.`;
  }

  prompt += `\n\n**Output Format**: Return the result purely as JSON matching the provided schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteSchema,
        systemInstruction: "You are a helpful and precise research assistant. Focus on accuracy and structure.",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from AI.");
    }

    const parsedResult = JSON.parse(resultText) as NoteResult;
    return parsedResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate notes. Please try again.");
  }
};