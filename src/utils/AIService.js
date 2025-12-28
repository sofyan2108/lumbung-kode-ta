import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inisialisasi hanya jika API Key ada
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const analyzeCodeWithAI = async (codeSnippet) => {
  // 1. Cek apakah API Key sudah dipasang
  if (!apiKey || !genAI) {
    console.error("API Key Gemini belum dipasang di .env.local");
    throw new Error("API Key Google Gemini belum dikonfigurasi. Silakan cek file .env.local Anda.");
  }


  let selectedModel = "gemini-1.5-flash"; // Default fallback

  try {
     // 2. Dynamic Model Discovery (Cari model yang tersedia di akun user)
     const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
     const response = await fetch(listModelsUrl);
     const data = await response.json();
     
     if (data.models) {
        // Cari model Gemini pertama yang support generateContent
        const validModel = data.models.find(m => 
            m.name.includes("gemini") && 
            m.supportedGenerationMethods?.includes("generateContent")
        );

        if (validModel) {
            // Hapus prefix "models/" jika ada, karena SDK kadang menambahkannya sendiri
            selectedModel = validModel.name.replace("models/", "");
            console.log("Auto-detected available model:", selectedModel);
        }
     }
  } catch (e) {
     console.warn("Gagal auto-detect model, menggunakan default:", selectedModel);
  }


    const model = genAI.getGenerativeModel({ model: selectedModel });

      
      const prompt = `
        Analyze the following code snippet and return a JSON object (without Markdown formatting). 
        The JSON must have these keys:
        1. "title": A short, descriptive title (max 50 chars).
        2. "language": The programming language (lowercase, e.g., "javascript", "python", "html", "css").
        3. "description": A concise explanation of what the code does (max 200 chars, in Indonesian language).
        4. "tags": An array of 3-5 keywords relevant to the code (lowercase).
        5. "dependencies": An array of library/package names used in the code (e.g., ["react", "axios", "pandas"]).
           Look for import statements, require calls, using statements, or pip installs.
           If no external dependencies found, return empty array [].
        6. "usage_example": A short code example showing how to use this snippet (max 150 chars).
           Format it as actual code. If not applicable, return empty string "".

        Code to analyze:
        ${codeSnippet}
      `;


      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const cleanedText = text.replace(/```json|```/g, "").trim();
            
            return JSON.parse(cleanedText);
        } catch (error) {
            const isOverloaded = error.message.includes("503") || error.message.includes("overloaded");
            
            if (isOverloaded && attempt < maxRetries - 1) {
                attempt++;
                const waitTime = attempt * 2000; // 2s, 4s...
                console.warn(`AI Model busy (503). Retrying in ${waitTime}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error(`AI Model (${selectedModel}) Failed after ${attempt + 1} attempts:`, error);
                throw new Error(isOverloaded ? "Server AI sedang sibuk (Overloaded). Silakan coba sesaat lagi." : (error.message || "Gagal menganalisis kode."));
            }
        }
      }
};