import { Invoice, AISuggestions } from "@/types";
import { convertToCoreMessages, generateText, streamText } from "ai";
import { createAzure } from "@ai-sdk/azure";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function getAISuggestions(
  invoice: Invoice,
  prompt: string
): Promise<AISuggestions> {
  try {
    const azure = createAzure({
      resourceName: "makers",
      apiKey: OPENAI_API_KEY,
    });

    const response = await generateText({
      model: azure("makers_gpt4o"),
      messages: convertToCoreMessages([
        {
          role: "system",
          content:
            "You are an AI assistant that helps with invoice analysis and suggestions.",
        },
        {
          role: "user",
          content: `Given this invoice: ${JSON.stringify(invoice)}, ${prompt}`,
        },
      ]),
      maxTokens: 150,
      temperature: 0.8,
    });

    const suggestion = response.text;

    // Parse the AI suggestion and return changes
    // This is a simplified version and may need to be adjusted based on the AI's response format
    const changes: Partial<Invoice> = JSON.parse(suggestion || "{}");

    return {
      changes,
      explanation: suggestion || "",
    };
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    throw new Error("Failed to get AI suggestions");
  }
}

export function applyChanges(
  invoice: Invoice,
  changes: Partial<Invoice>
): Invoice {
  return { ...invoice, ...changes };
}
