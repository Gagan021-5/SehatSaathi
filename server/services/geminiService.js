import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const model = genAI.getGenerativeModel({ model: modelName });

const LANG = {
    en: 'Respond in English.',
    hi: 'Respond in Hindi (हिन्दी). Use simple Hindi with Devanagari script.',
    bn: 'Respond in Bengali (বাংলা). Use simple Bengali.',
    ta: 'Respond in Tamil (தமிழ்). Use simple Tamil.',
    te: 'Respond in Telugu (తెలుగు). Use simple Telugu.',
    mr: 'Respond in Marathi (मराठी). Use simple Marathi.',
    gu: 'Respond in Gujarati (ગુજરાતી). Use simple Gujarati.',
    kn: 'Respond in Kannada (ಕನ್ನಡ). Use simple Kannada.',
};

const lang = (l) => LANG[l] || LANG.en;

async function gen(prompt) {
    const r = await model.generateContent(prompt);
    return r.response.text();
}

async function genJSON(prompt) {
    const text = await gen(prompt);
    try {
        const m = text.match(/\{[\s\S]*\}/);
        return m ? JSON.parse(m[0]) : { raw: text };
    } catch {
        return { raw: text };
    }
}

export async function explainDiabetesRisk(mlResult, patientData, language = 'en', patientName = '') {
    const nameClause = patientName
        ? `The patient's name is ${patientName}. Address them warmly by their first name throughout the response.`
        : '';
    const prompt = `${lang(language)}

You are a caring, empathetic doctor explaining diabetes risk assessment results to your patient.
${nameClause}
Patient data: ${JSON.stringify(patientData)}
ML Prediction: ${JSON.stringify(mlResult)}

Return JSON with these exact keys:
{
  "summary": "2-3 sentence summary of the risk assessment, addressing the patient by name if provided",
  "recommendations": ["list of 4-5 actionable health recommendations"],
  "diet_advice": { "eat": ["foods to eat"], "avoid": ["foods to avoid"] },
  "exercise": "exercise recommendation paragraph",
  "when_to_see_doctor": "when they should see a doctor",
  "specialist_type": "type of specialist to consult",
  "lifestyle_changes": ["3-4 lifestyle changes"]
}

Use SIMPLE words. Be warm and reassuring. Never diagnose definitively. If the patient name is known, use it naturally.`;
    return await genJSON(prompt);
}

export async function explainPrediction(mlResult, language = 'en') {
    const prompt = `${lang(language)}

Explain this disease prediction to a patient simply:
Predicted: ${mlResult.predictions?.[0]?.disease || mlResult.prediction || 'Unknown'}
Confidence: ${mlResult.predictions?.[0]?.confidence ? Math.round(mlResult.predictions[0].confidence * 100) + '%' : 'N/A'}
Symptoms: ${mlResult.matched_symptoms?.join(', ') || 'Not specified'}

Return JSON:
{
  "summary": "brief explanation of the condition",
  "what_it_is": "simple description",
  "why_these_symptoms": "connection between symptoms and condition",
  "recommendations": ["4-5 things to do"],
  "home_remedies": ["2-3 safe home remedies"],
  "when_to_see_doctor": "when to seek medical help",
  "severity": "mild|moderate|severe"
}`;
    return await genJSON(prompt);
}

export async function explainRiskScore(riskData, vitals, language = 'en') {
    const prompt = `${lang(language)}

Explain this health risk assessment:
Risk Level: ${riskData.risk_level}, Score: ${riskData.risk_score}
Vitals: ${JSON.stringify(vitals)}

Return JSON:
{
  "summary": "brief assessment",
  "recommendations": ["4-5 health tips"],
  "risk_factors": ["factors contributing to risk"],
  "positive_factors": ["factors in patient's favor"]
}`;
    return await genJSON(prompt);
}

export async function chatWithPatient(messages, language = 'en') {
    const sys = `You are SehatSaathi AI, a compassionate village doctor. ${lang(language)}
Rules: Use simple words, ask follow-ups, suggest when to see a doctor, never diagnose definitively, be warm and empathetic, keep responses concise.`;

    const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
        history: history.slice(0, -1),
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    const last = history[history.length - 1];
    const prompt = history.length === 1
        ? `${sys}\n\nPatient says: ${last.parts[0].text}`
        : last.parts[0].text;

    const result = await chat.sendMessage(prompt);
    return result.response.text();
}

export async function analyzePrescription(imageBase64, language = 'en') {
    const prompt = `${lang(language)}

Analyze this prescription image. Extract all medicines, dosages, instructions.
Return JSON: {
  "text": "full OCR text",
  "medicines": [{ "name": "", "dosage": "", "frequency": "", "duration": "", "instructions": "" }],
  "doctor": "", "notes": "",
  "interactions": [{ "drug1": "", "drug2": "", "warning": "" }],
  "generic_alternatives": [{ "brand": "", "generic": "", "savings": "" }],
  "dietary_advice": ["advice items"]
}`;
    const imagePart = { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } };
    return await genJSON([prompt, imagePart]);
}

export async function getEmergencyGuidance(situation, language = 'en') {
    const prompt = `${lang(language)}

EMERGENCY first-aid. A panicked person must understand.
Situation: ${situation}

Return JSON: {
  "title": "Emergency Title",
  "steps": ["step 1", "step 2", ...max 8],
  "do_not": ["thing to NOT do", ...],
  "while_waiting": ["what to do while waiting for help"],
  "call_emergency": true,
  "severity": "critical|serious|moderate"
}`;
    return await genJSON(prompt);
}

export async function explainMedicineSimply(medicine, language = 'en') {
    const medName = typeof medicine === 'string' ? medicine : medicine.name;
    const prompt = `${lang(language)}

Explain this medicine simply to a patient:
Medicine: ${medName}
${medicine.dosage ? `Dosage: ${medicine.dosage}` : ''}

Return JSON: { "name": "${medName}", "simpleExplanation": "", "timing": { "morning": true, "afternoon": false, "evening": true, "night": false }, "withFood": true, "warnings": [], "avoidWith": [] }`;
    return await genJSON(prompt);
}

export async function analyzeHealthRecords(records, language = 'en') {
    const prompt = `${lang(language)}

Analyze these health vitals and give recommendations:
Records: ${JSON.stringify(records)}

Return JSON: {
  "health_score": 0-100,
  "summary": "brief health summary",
  "recommendations": ["4-5 recommendations"],
  "risk_factors": ["any concerning trends"],
  "positive_notes": ["positive health indicators"]
}`;
    return await genJSON(prompt);
}
