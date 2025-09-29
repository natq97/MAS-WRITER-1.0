import { GoogleGenAI, Type } from "@google/genai";
import { SectionStatus, type OutlineItem, type ResearchResult, type Message } from '../types';

// In a real application, the API key would be securely managed.
// For this environment, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates initial content for a section when there is no prior chat history.
 * This is a single-turn generation, not a chat continuation.
 * @param initialPrompt The instruction for generation (e.g., "Write content for 'Introduction'").
 * @param contextSections Content from other referenced sections.
 * @param researchContext Content from the research agent.
 * @param globalKnowledgeContext Content from the project's global knowledge base.
 * @param systemInstruction A specific system prompt for the agent.
 * @returns The generated content as a string.
 */
export const generateInitialDraft = async (initialPrompt: string, contextSections: string, researchContext: string, globalKnowledgeContext: string, systemInstruction?: string): Promise<string> => {
  console.log("Calling Gemini API for Writer Agent (Initial Draft).");

  try {
    // We construct a single, comprehensive prompt for the model.
    const fullPrompt = `
      ${globalKnowledgeContext}

      ${researchContext}

      ${contextSections}

      ---
      User instruction: "${initialPrompt}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // The `contents` array contains just this single, comprehensive prompt.
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call for generateInitialDraft failed:", error);
    throw new Error("Failed to generate initial draft from AI Agent.");
  }
};


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
 * Creates a tailored system prompt for the Outliner Agent based on the flow's coordinator prompt.
 * This function acts as the "Coordinator Agent".
 * @param coordinatorPrompt The master prompt for the entire flow.
 * @returns A tailored system prompt for the Outliner Agent as a string.
 */
export const createOutlinerSystemPrompt = async (coordinatorPrompt: string): Promise<string> => {
  console.log("Calling Gemini API to create a tailored system prompt for the Outliner");

  const prompt = `
    A high-level master instruction for an entire authoring project has been provided:
    --- MASTER INSTRUCTION (COORDINATOR PROMPT) ---
    ${coordinatorPrompt}
    --- END MASTER INSTRUCTION ---

    Based ONLY on this master instruction, generate a concise and specific "system prompt" for an AI Outliner Agent.
    This system prompt must guide the Outliner Agent to create and modify document outlines in Markdown format.
    It should incorporate the key goals from the master instruction (e.g., tone, target audience, complexity).
    It must also retain the core technical instructions for the Outliner Agent: to process user requests, work with Markdown lists, and return ONLY the complete, updated Markdown list without any extra text, markdown formatting (like \`\`\`), or explanations.

    The final system prompt should be a direct instruction to the AI, starting with "You are...".

    **Generate the System Prompt for the Outliner Agent now.**
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API call for createOutlinerSystemPrompt failed:", error);
    throw new Error("Failed to create a tailored system prompt for the Outliner.");
  }
};


/**
 * Generates or modifies a document outline using the Outliner Agent, returning a text-based (Markdown) format.
 * @param currentOutlineText The existing outline structure as a Markdown string.
 * @param prompt The user's instruction for modification.
 * @param systemInstruction The dynamically generated system prompt that guides the agent.
 * @returns The new, updated outline as a Markdown string.
 */
export const generateOutline = async (currentOutlineText: string, prompt: string, systemInstruction: string): Promise<string> => {
    console.log("Calling Gemini API for Outliner Agent (Text Mode)");

    const fullPrompt = `
      Please process the user's command regarding the document outline.

      Current Outline (Markdown):
      ${currentOutlineText || "(empty)"}

      ---
      User Command: "${prompt}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
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
 * Creates a tailored prompt for the Research Agent based on the user's query and the flow's coordinator prompt.
 * This function acts as the "Coordinator Agent".
 * @param query The user's research query.
 * @param coordinatorPrompt The master prompt for the entire flow.
 * @returns A tailored prompt for the Research Agent as a string.
 */
export const createResearchAgentPrompt = async (query: string, coordinatorPrompt: string): Promise<string> => {
  console.log("Calling Gemini API to create a tailored prompt for the Research Agent");

  const metaPrompt = `
    You are a master coordinator for an AI authoring system. Your primary role is to craft the perfect prompts for other specialized AI agents.

    A high-level master instruction for an entire authoring project has been provided:
    --- MASTER INSTRUCTION (COORDINATOR PROMPT) ---
    ${coordinatorPrompt}
    --- END MASTER INSTRUCTION ---

    A user needs to research a specific topic to help with this project.
    **User's Research Topic:** "${query}"

    Your task is to generate a concise and effective prompt for a "Research Agent". This Research Agent has access to Google Search. The prompt you generate should instruct the Research Agent to:
    1.  Clearly understand the user's topic.
    2.  Keep the project's master instruction in mind to find the most relevant results.
    3.  Return the top 3 most relevant results.
    4.  For each result, provide a title and a one-sentence summary.
    5.  Format the response clearly.

    The final generated prompt must be a single, direct instruction to the Research Agent. Do not add any conversational text or explanations.

    **Generate the prompt for the Research Agent now.**
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API call for createResearchAgentPrompt failed:", error);
    throw new Error("Failed to create a tailored prompt for the Research agent.");
  }
};


/**
 * Researches a topic using the Research Agent with Google Search grounding.
 * @param generatedPrompt The full, tailored prompt generated by the Coordinator Agent.
 * @returns A list of research results with titles, URLs, and summaries.
 */
export const researchTopic = async (generatedPrompt: string): Promise<ResearchResult[]> => {
    console.log("Calling Gemini API for Research Agent with Google Search");
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: generatedPrompt,
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
 * This function acts as the "Coordinator Agent".
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
    // This function acts as the "Coordinator Agent", creating a tailored prompt based on the master instruction.
    // The result is the final, specific system prompt for the Writer Agent.
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API call for createTailoredSystemPrompt failed:", error);
    throw new Error("Failed to create a tailored system prompt.");
  }
};