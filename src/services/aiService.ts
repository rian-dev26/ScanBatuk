import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined);
    if (!key) {
      console.warn("Gemini API Key missing. Using mock responses.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || 'mock-key' });
  }
  return aiClient;
}

import { User } from '../types';

export async function analyzeCoughAudio(audioBlob: Blob, userContext?: Partial<User>): Promise<{ riskLevel: string, score: number, insight: string }> {
  // Fallback map if the API fails or no key
  const fallbackResult = {
    riskLevel: 'Medium Risk' as 'Low Risk' | 'Medium Risk' | 'High Risk',
    score: 65,
    insight: 'Pola batuk menunjukkan adanya anomali yang perlu diperhatikan. Ini adalah hasil simulasi karena AI tidak dapat dihubungi. Pastikan API Key Gemini sudah terpasang.'
  };

  const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key || key === 'mock-key') {
     return new Promise(resolve => setTimeout(() => resolve(fallbackResult), 2500));
  }

  try {
    const ai = getGemini();
    // Convert Blob to Base64 to send to Gemini API
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
         if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
         } else {
            reject(new Error("Failed to read audio"));
         }
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const promptText = `You are 'ScanBatuk AI', an advanced respiratory acoustic analysis expert system. 
Your task is to process audio files with absolute clinical precision. 
FOLLOW THIS STRICT PROTOCOL WITHOUT EXCEPTION:

1. PRIMARY FILTER (ZERO-TOLERANCE FOR NON-COUGH):
   - Detect whether the audio is dominated by HUMAN COUGHING or other sounds.
   - IF YOU HEAR: People talking (even if they are discussing coughs/illnesses), mumbling, music, or background noise without clear coughing sounds.
   - MANDATORY ACTION (IF NOT COUGH): 
     * riskLevel: "Low Risk"
     * score: A number between 1 and 9
     * insight: "Sistem tidak mendeteksi suara batuk yang valid. Audio teridentifikasi sebagai percakapan atau kebisingan latar. Silakan rekam ulang suara batuk Anda secara natural di tempat yang tenang."

2. ACOUSTIC CLINICAL ANALYSIS (ONLY if cough is confirmed):
   Identify the following features from the cough sound:
   - Type: Dry (non-productive, sharp/harsh), Wet (productive, rattling/mucus sound), Barking, or Wheezing.
   - Frequency: How many cough repetitions occur in the 6 seconds.
   - Intensity: Does the cough sound shallow (throat) or deep (lower lungs).

3. PRECISION DYNAMIC SCORING (1-100):
   - STRICTLY FORBIDDEN to use standard/default benchmark numbers (like 65).
   - Calculate a specific score (e.g., 28, 54, 82) based on the combination of frequency, intensity, and sound anomalies (mucus/wheezing).
   - Scoring Guide: 
     * Mild/occasional cough (dry): 15-35
     * Moderate cough (repeated/mildly wet): 36-69
     * Severe cough (loud/paroxysmal/wheezing/shortness of breath): 70-95

4. OUTPUT RULES (STRICT JSON FORMAT):
   - Output MUST ONLY be valid JSON. 
   - DO NOT use markdown code blocks (\`\`\`json ... \`\`\`), introductory text, or closing text. 
   - Mandatory Schema:
   {"riskLevel": "Low Risk" | "Medium Risk" | "High Risk", "score": number, "insight": string}
   
   - The 'insight' field MUST BE IN INDONESIAN, empathetic, professional, and explain specifically WHAT YOU HEAR (example: 'Terdengar 3 kali repetisi batuk basah dengan intensitas sedang, mengindikasikan adanya penumpukan dahak...'). 
   - End the 'insight' sentence with exactly: 'Catatan: Ini HANYA skrining awal dari AI, bukan diagnosis medis. Konsultasikan dengan dokter untuk kepastiannya.'`;

    let finalPromptText = promptText;
    if (userContext && (userContext.age || userContext.isSmoker !== undefined || userContext.coughDurationDays || userContext.symptoms)) {
      finalPromptText += `\n\nADDITIONAL PATIENT MEDICAL CONTEXT:\n`;
      if (userContext.age) finalPromptText += `- Age: ${userContext.age} years old\n`;
      if (userContext.isSmoker !== undefined) finalPromptText += `- Smoking Status: ${userContext.isSmoker ? 'Yes, Active Smoker' : 'Non-Smoker'}\n`;
      if (userContext.coughDurationDays) finalPromptText += `- Cough Duration: ${userContext.coughDurationDays} days\n`;
      if (userContext.symptoms) finalPromptText += `- Accompanying Symptoms: ${userContext.symptoms}\n`;
      finalPromptText += `Use the medical context above to provide a more accurate and personalized insight in Indonesian. Especially if there are Accompanying Symptoms, consider whether they point to a serious infection (e.g., fever/shortness of breath) or a common allergy.`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: finalPromptText },

                    { inlineData: { data: base64Audio, mimeType: audioBlob.type || 'audio/webm' } }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
        }
    });

    if (response.text) {
      // Parse the JSON. We remove markdown if the model hallucinates it despite the system prompt.
      const jsonText = response.text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(jsonText);
      return {
         riskLevel: result.riskLevel || 'Medium Risk',
         score: result.score || 50,
         insight: result.insight || 'Analisis gagal memberikan rincian detail. Konsultasikan dengan dokter.'
      };
    }
    
    throw new Error("Empty response dari Google Gemini");
  } catch (err: any) {
    console.error("Kesalahan Gemini Audio API:", err);
    return {
      riskLevel: 'Medium Risk',
      score: 50,
      insight: `Terjadi kesalahan pada AI: ${err.message}. Tolong beri tahu developer.`
    };
  }
}

export async function askHealthAssistant(message: string, history: any[], userLocation?: { lat: number, lng: number } | null): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined);
  if (!key) {
     return new Promise(resolve => setTimeout(() => resolve("Maaf, API Key Gemini belum dikonfigurasi. Ini adalah balasan simulasi. Hubungi fasilitas kesehatan terdekat untuk informasi lebih lanjut mengenai gejala Anda."), 1000));
  }

  try {
    const ai = getGemini();
    let systemInstruction = "Kamu adalah asisten kesehatan AI yang empatik dari ScanBatuk. Tugasmu adalah mengedukasi tentang masalah pernapasan. Jawab dengan ramah, suportif, dan menenangkan. Gunakan bahasa Indonesia. JANGAN PERNAH memberikan diagnosis medis. Selalu sarankan untuk berkonsultasi dengan dokter untuk diagnosis pasti.";
    
    if (userLocation) {
      systemInstruction += `\n\nLokasi pengguna saat ini berada di koordinat Latitude: ${userLocation.lat}, Longitude: ${userLocation.lng}. Jika pengguna bertanya tentang rumah sakit, klinik, atau faskes terdekat, berikan panduan bahwa mereka bisa menggunakan fitur 'Faskes Terdekat' di aplikasi ini, dan jika memungkinkan berikan rekomendasi umum berdasarkan lokasi mereka.`;
    }

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Replay history
    for (const msg of history) {
        if (msg.role === 'user') {
            await chat.sendMessage({message: msg.content});
        }
    }

    const response = await chat.sendMessage({message});
    return response.text;
  } catch (err: any) {
    console.error("Error asking Gemini:", err);
    if (err?.message?.includes("503") || err?.message?.includes("high demand") || err?.status === 503) {
      return "Mohon maaf, server AI sedang mengalami lonjakan permintaan (High Demand). Silakan tunggu beberapa saat dan coba lagi.";
    }
    return "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi nanti.";
  }
}
