import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("Gemini API Key missing. Using mock responses.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || 'mock-key' });
  }
  return aiClient;
}

export async function analyzeCoughAudio(audioBlob: Blob): Promise<{ riskLevel: string, score: number, insight: string }> {
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "Anda adalah AI pendeteksi pola suara batuk dari platform kesehatan 'ScanBatuk'. Analisis input audio batuk ini. Berikan evaluasi berupa tingkat risiko indikasi penyakit pernapasan (TB, infeksi, asma, dsb), berikan skor (0-100), dan berikan insight detail dalam bahasa Indonesia dengan nada empatik, profesional, dan menenangkan (seperti instruksi Apple Health).\n\nIngat, di akhir insight tekankan bahwa ini HANYA skrining awal, BUKAN diagnosis medis, dan arahkan user ke dokter.\n\nAnda HANYA boleh membalas dalam format JSON yang valid persis seperti kerangka ini tanpa tambahan markdown (```json ... ```):\n{\"riskLevel\": \"Low Risk\" | \"Medium Risk\" | \"High Risk\", \"score\": number, \"insight\": string}" },
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
    
    throw new Error("Empty response");
  } catch (err) {
    console.error("Kesalahan Gemini Audio API:", err);
    return fallbackResult;
  }
}

export async function askHealthAssistant(message: string, history: any[], userLocation?: { lat: number, lng: number } | null): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
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
