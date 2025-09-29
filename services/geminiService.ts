import { GoogleGenAI, Type } from "@google/genai";
import { SectionStatus, type OutlineItem, type ResearchResult, type Message } from '../types';

// In a real application, the API key would be securely managed.
// For this environment, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * The system prompt that defines the behavior of the Outliner Agent.
 */
export const OUTLINER_SYSTEM_PROMPT = `You are a professional editor and content strategist.
Your task is to process a user's request to either create a new document outline or modify an existing one.
The outline is provided as a Markdown list.
You MUST return the complete, updated outline as a single, clean Markdown list. Use hyphens (-) and indentation to represent hierarchy.
Do NOT add any explanatory text, markdown formatting (like \`\`\`), or anything else before or after the Markdown list. Your entire response must be only the list.`;


/**
 * Generates content using the Writer Agent, now with chat history awareness.
 * @param messages The entire conversation history for the current section.
 * @param contextSections The content from other referenced sections.
 * @param researchContext The content from the research agent for this session.
 * @param globalKnowledgeContext The content from the project's global knowledge base.
 * @param systemInstruction A specific system prompt for the agent (which includes coordinator instructions).
 * @returns The generated content as a string.
 */
export const generateContent = async (messages: Message[], contextSections: string, researchContext: string, globalKnowledgeContext: string, systemInstruction?: string): Promise<string> => {
  console.log("Calling Gemini API for Writer Agent with conversation history.");
  
  if (messages.length === 0) {
    throw new Error("Cannot generate content with an empty message history.");
  }

  try {
    // Convert our app's Message format to the Gemini API's Content format.
    const geminiHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // The last message is the user's current prompt. We need to prepend the context to it.
    const lastMessage = geminiHistory[geminiHistory.length - 1];
    if (lastMessage.role === 'user') {
        const originalPrompt = lastMessage.parts[0].text;
        lastMessage.parts[0].text = `
          ${globalKnowledgeContext}

          ${researchContext}

          ${contextSections}
    
          ---
          User instruction: "${originalPrompt}"
        `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geminiHistory,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call for generateContent failed:", error);
    throw new Error("Failed to generate content from AI Agent.");
  }
};

/**
 * Helper function to add frontend-specific metadata to an AI-generated outline.
 * The AI only generates `title` and `children`. This function adds `id`, `level`, and `status`.
 */
const addMetadataToOutline = (items: any[], level = 0, parentId = ''): OutlineItem[] => {
    // A simple recursive function to traverse the AI-generated structure.
    return items.map((item, index) => {
        const id = parentId ? `${parentId}.${index + 1}` : `${index + 1}`;
        const cleanItem: OutlineItem = {
            id,
            title: item.title || 'Untitled',
            level,
            status: SectionStatus.Outline,
            children: item.children ? addMetadataToOutline(item.children, level + 1, id) : [],
        };
        return cleanItem;
    });
};


/**
 * Generates or modifies a document outline using the Outliner Agent, returning a text-based (Markdown) format.
 * @param currentOutlineText The existing outline structure as a Markdown string.
 * @param prompt The user's instruction for modification.
 * @param coordinatorPrompt The master prompt for the entire project.
 * @returns The new, updated outline as a Markdown string.
 */
export const generateOutline = async (currentOutlineText: string, prompt: string, coordinatorPrompt: string): Promise<string> => {
    console.log("Calling Gemini API for Outliner Agent (Text Mode)");

    const fullPrompt = `
      Current Outline (Markdown):
      ${currentOutlineText || "(empty)"}

      ---
      User Command: "${prompt}"
    `;

    const combinedSystemInstruction = `${coordinatorPrompt}\n\n---\n\n${OUTLINER_SYSTEM_PROMPT}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: combinedSystemInstruction,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API call for generateOutline (Text Mode) failed:", error);
        throw new Error("Failed to generate outline from AI Agent.");
    }
};

/**
 * Parses a text-based (Markdown) outline into a structured JSON format.
 * @param outlineText The Markdown string of the outline.
 * @returns A structured outline.
 */
export const parseOutlineText = async (outlineText: string): Promise<OutlineItem[]> => {
    console.log("Calling Gemini API to parse outline text to JSON");
    
    const systemInstruction = `You are a content structure specialist. Your task is to convert a Markdown-formatted outline into a structured JSON array.
The JSON structure for each node is: { "title": string, "children": [...] }.
Crucially, for each "title", you MUST prepend a clear hierarchical numbering scheme (e.g., "1.", "1.1.", "1.1.1."). Choose a scheme that is appropriate for a formal document and apply it consistently.
Do NOT add any explanatory text, markdown formatting, or anything else before or after the JSON output. Your entire response must be only the JSON array.`;

    const fullPrompt = `
      Please convert the following Markdown outline to the specified JSON format. Ensure you add hierarchical numbering to each title.

      Markdown Outline:
      ${outlineText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        let jsonString = response.text.trim();
        // The model might still wrap the JSON in ```json ... ```, so we clean it.
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        }
        
        const parsedOutline = JSON.parse(jsonString);
        
        if (!Array.isArray(parsedOutline)) {
            throw new Error("AI response is not a valid JSON array for the outline.");
        }
        
        return addMetadataToOutline(parsedOutline);
    } catch (error) {
        console.error("Gemini API call for parseOutlineText failed:", error);
        throw new Error("Failed to parse outline from AI Agent.");
    }
};


/**
 * Researches a topic using the Research Agent with Google Search grounding.
 * @param query The topic to research.
 * @returns A list of research results with titles, URLs, and summaries.
 */
export const researchTopic = async (query: string): Promise<ResearchResult[]> => {
    console.log("Calling Gemini API for Research Agent with Google Search");
    
    const prompt = `You are a Research Agent. Your task is to perform a web search about the following topic and return the top 3 results. For each result, provide the title and a one-sentence summary. Format your response clearly. Topic: "${query}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const responseText = response.text;

        // A more robust regex to capture various title/summary formats
        const results: Omit<ResearchResult, 'id' | 'url'>[] = [];
        const lines = responseText.split('\n').filter(line => line.trim() !== '');
        
        for(let i=0; i < lines.length; i++){
            // Look for a title-like line, possibly followed by a summary line
            const titleMatch = lines[i].match(/(?:^\d+\.\s*|Title:)\s*(.*)/i);
            if(titleMatch && titleMatch[1]){
                const title = titleMatch[1].replace(/\*\*/g, '').trim();
                let summary = 'No summary available.';
                // Check if the next line is likely a summary
                if (i + 1 < lines.length && !lines[i+1].match(/^\d+\.\s*|Title:/i)) {
                    summary = lines[i+1].replace(/(Summary:)\s*/i, '').trim();
                }
                 results.push({ title, summary });
            }
        }
        
        // Combine parsed text with grounding metadata URLs
        return results.slice(0, 3).map((result, index) => {
            const chunk = groundingChunks[index]?.web;
            return {
                id: `res${Date.now()}${index}`,
                title: chunk?.title || result.title,
                url: chunk?.uri || '#',
                summary: result.summary,
            };
        });

    } catch (error) {
        console.error("Gemini API call for researchTopic failed:", error);
        throw new Error("Failed to research topic with AI Agent.");
    }
};

/**
 * Creates a tailored system prompt for the Writer Agent based on the document context.
 * @param documentTitle The main title of the document.
 * @param outlineStructure A string representation of the document's outline.
 * @param currentSectionTitle The title of the section being written.
 * @param coordinatorPrompt The master prompt for the entire project.
 * @returns A tailored system prompt as a string.
 */
export const createTailoredSystemPrompt = async (
  documentTitle: string,
  outlineStructure: string,
  currentSectionTitle: string,
  coordinatorPrompt: string
): Promise<string> => {
  console.log("Calling Gemini API to create a tailored system prompt");

  const prompt = `
    A high-level Coordinator Agent has provided the following master instruction for the entire project:
    --- COORDINATOR PROMPT ---
    ${coordinatorPrompt}
    --- END COORDINATOR PROMPT ---

    Based on this master instruction, the overall document structure, and the current section, generate a concise and specific "system prompt" for an AI Writer Agent.
    This system prompt should guide the AI to write content that is perfectly aligned with the section's role within the document.
    It should define the AI's persona, its specific goal for this section, and the expected tone and style. The prompt should be a direct instruction to the AI, starting with "You are...".

    **Overall Document Title:** "${documentTitle}"

    **Document Outline Structure:**
    ${outlineStructure}

    **Current Section to Write:** "${currentSectionTitle}"

    **Generate the System Prompt now.**
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // The final prompt for the agent will be a combination of the coordinator's high-level instruction and the specific tailored one.
    return `${coordinatorPrompt}\n\n---\n\n${response.text.trim()}`;
  } catch (error) {
    console.error("Gemini API call for createTailoredSystemPrompt failed:", error);
    throw new Error("Failed to create a tailored system prompt.");
  }
};