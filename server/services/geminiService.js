import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const LANG_INSTRUCTIONS = {
    en: 'Respond in English.',
    hi: 'Respond in Hindi (हिन्दी). Use simple, conversational Hindi that a village person can understand. Use Devanagari script.',
    bn: 'Respond in Bengali (বাংলা). Use simple Bengali with Bengali script.',
    ta: 'Respond in Tamil (தமிழ்). Use simple Tamil with Tamil script.',
    te: 'Respond in Telugu (తెలుగు). Use simple Telugu with Telugu script.',
    mr: 'Respond in Marathi (मराठी). Use simple Marathi with Devanagari script.',
    gu: 'Respond in Gujarati (ગુજરાતી). Use simple Gujarati with Gujarati script.',
    kn: 'Respond in Kannada (ಕನ್ನಡ). Use simple Kannada with Kannada script.'
};

function getLangInstruction(language) {
    return LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.en;
}

export async function chatWithPatient(messages, language = 'en') {
    const langInst = getLangInstruction(language);
    const systemPrompt = `You are SehatSaathi AI, a compassionate village doctor. ${langInst}\n\nRules:\n- Use simple words, avoid complex medical jargon\n- Ask relevant follow-up questions\n- Suggest when to visit a doctor urgently\n- Never diagnose definitively\n- Be warm, empathetic, and reassuring\n- Keep responses concise`;

    const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
        history: chatHistory.slice(0, -1),
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    });

    const lastMessage = chatHistory[chatHistory.length - 1];
    const prompt = chatHistory.length === 1
        ? `${systemPrompt}\n\nPatient says: ${lastMessage.parts[0].text}`
        : lastMessage.parts[0].text;

    const result = await chat.sendMessage(prompt);
    return result.response.text();
}

export async function explainPrediction(mlResult, language = 'en') {
    const langInst = getLangInstruction(language);
    const prompt = `${langInst}\n\nExplain this disease prediction to a patient with basic education.\nPredicted Disease: ${mlResult.prediction || mlResult.disease}\nConfidence: ${mlResult.confidence ? Math.round(mlResult.confidence * 100) + '%' : 'N/A'}\nSymptoms: ${mlResult.symptoms?.join(', ') || 'Not specified'}\n\nExplain simply: what it is, why these symptoms, what to do next, when to see a doctor, safe home remedies. Keep it short.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function explainRiskScore(riskData, language = 'en') {
    const langInst = getLangInstruction(language);
    const prompt = `${langInst}\n\nExplain this health risk assessment simply:\nRisk Score: ${riskData.score}/10\nRisk Level: ${riskData.level}\nFactors: ${JSON.stringify(riskData.factors || {})}\n\nGive 3 practical health tips.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function analyzePrescription(imageBase64, language = 'en') {
    const langInst = getLangInstruction(language);
    const prompt = `${langInst}\n\nAnalyze this prescription image. Extract all medicines, dosages, instructions.\nReturn JSON: { "text": "OCR text", "medicines": [{ "name": "", "dosage": "", "frequency": "", "duration": "" }], "doctor": "", "notes": "" }`;
    const imagePart = { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } };
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    try { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { text, medicines: [] }; }
    catch { return { text, medicines: [] }; }
}

export async function explainMedicineSimply(medicine, language = 'en') {
    const langInst = getLangInstruction(language);
    const medName = typeof medicine === 'string' ? medicine : medicine.name;
    const prompt = `${langInst}\n\nExplain this medicine to a village grandmother:\nMedicine: ${medName}\n${medicine.dosage ? `Dosage: ${medicine.dosage}` : ''}\n\nReturn JSON: { "name": "${medName}", "simpleExplanation": "", "timing": { "morning": true/false, "afternoon": true/false, "evening": true/false, "night": true/false }, "withFood": true/false, "warnings": [], "avoidWith": [] }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { name: medName, simpleExplanation: text }; }
    catch { return { name: medName, simpleExplanation: text }; }
}

export async function getEmergencyGuidance(situation, language = 'en') {
    const langInst = getLangInstruction(language);
    const prompt = `${langInst}\n\nEMERGENCY first-aid instructions. A panicked person must understand.\nSituation: ${situation}\n\nUse SHORT sentences, SIMPLE words. Number each step. Max 8 steps. Include when to call 112.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}
