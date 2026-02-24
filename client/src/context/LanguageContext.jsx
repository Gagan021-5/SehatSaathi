import { createContext, useContext, useState, useEffect } from 'react';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-IN', geminiInstruction: 'Respond in English.' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN', geminiInstruction: 'Respond in Hindi (हिन्दी). Use simple, conversational Hindi that a village person can understand. Use Devanagari script.' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', speechCode: 'bn-IN', geminiInstruction: 'Respond in Bengali (বাংলা). Use simple Bengali with Bengali script.' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechCode: 'ta-IN', geminiInstruction: 'Respond in Tamil (தமிழ்). Use simple Tamil with Tamil script.' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechCode: 'te-IN', geminiInstruction: 'Respond in Telugu (తెలుగు). Use simple Telugu with Telugu script.' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechCode: 'mr-IN', geminiInstruction: 'Respond in Marathi (मराठी). Use simple Marathi with Devanagari script.' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechCode: 'gu-IN', geminiInstruction: 'Respond in Gujarati (ગુજરાતી). Use simple Gujarati with Gujarati script.' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', speechCode: 'kn-IN', geminiInstruction: 'Respond in Kannada (ಕನ್ನಡ). Use simple Kannada with Kannada script.' }
];

const translationMap = {
    en: {
        app: { name: 'SehatSaathi', tagline: 'Your AI Health Companion' },
        nav: { dashboard: 'Dashboard', chat: 'AI Doctor', predict: 'Symptom Checker', prescription: 'Prescriptions', health: 'Health Records', hospitals: 'Find PHC', emergency: 'Emergency SOS', profile: 'Profile' },
        chat: { title: 'Talk to AI Doctor', subtitle: 'Describe your symptoms in your language', placeholder: 'Type or speak your symptoms...', voiceHint: 'Tap the mic to speak', listening: 'Listening...', thinking: 'Thinking...', send: 'Send' },
        voice: { speakNow: 'Speak now...', tapToStop: 'Tap to stop', readAloud: 'Read aloud', stop: 'Stop', speed: 'Speed' },
        emergency: { title: 'Emergency Help', call: 'Call Ambulance', firstAid: 'First Aid Guide' },
        common: { loading: 'Loading...', error: 'Something went wrong', retry: 'Try Again', offline: 'You are offline', back: 'Back', save: 'Save', cancel: 'Cancel' },
        onboarding: { welcome: 'Welcome to SehatSaathi', chooseLanguage: 'Choose your language', continue: 'Continue' },
        home: { hero: 'AI Healthcare for Everyone', heroSub: 'Get medical guidance in your language with voice support', features: 'Features', voiceDoc: 'Voice-First AI Doctor', voiceDocDesc: 'Speak your symptoms, get advice read aloud', multiLang: '8 Indian Languages', multiLangDesc: 'Healthcare in Hindi, Tamil, Bengali & more', phcFind: 'Find Nearest PHC', phcFindDesc: 'Locate government health centers nearby', mlPredict: 'AI Disease Prediction', mlPredictDesc: 'ML-powered symptom analysis with explanations', stats: { languages: '8 Languages', patients: '24/7 Available', accuracy: 'AI Powered', offline: 'Offline Ready' } },
        hospitals: { title: 'Find Hospitals', allHospitals: 'All Hospitals', govPHC: 'Government PHC', nearest: 'Nearest', distance: 'Distance', directions: 'Get Directions', call: 'Call', services: 'Services', hours: 'Working Hours' },
        prescription: { title: 'Prescriptions', upload: 'Upload Prescription', explain: 'Medicine Explanation', listen: 'Listen', timing: 'Timing', withFood: 'With Food', emptyStomach: 'Empty Stomach', warnings: 'Warnings', avoid: 'Avoid' },
        predict: { title: 'Symptom Checker', subtitle: 'Select your symptoms for AI analysis', analyze: 'Analyze Symptoms', result: 'Prediction Result', confidence: 'Confidence', explanation: 'AI Explanation' }
    },
    hi: {
        app: { name: 'सेहतसाथी', tagline: 'आपका AI स्वास्थ्य साथी' },
        nav: { dashboard: 'होम', chat: 'AI डॉक्टर', predict: 'लक्षण जांच', prescription: 'प्रिस्क्रिप्शन', health: 'स्वास्थ्य रिकॉर्ड', hospitals: 'नजदीकी PHC', emergency: 'आपातकालीन SOS', profile: 'प्रोफ़ाइल' },
        chat: { title: 'AI डॉक्टर से बात करें', subtitle: 'अपनी भाषा में लक्षण बताएं', placeholder: 'अपने लक्षण लिखें या बोलें...', voiceHint: 'बोलने के लिए माइक दबाएं', listening: 'सुन रहे हैं...', thinking: 'सोच रहे हैं...', send: 'भेजें' },
        voice: { speakNow: 'अब बोलिए...', tapToStop: 'रोकने के लिए दबाएं', readAloud: 'पढ़कर सुनाएं', stop: 'रुकें', speed: 'गति' },
        emergency: { title: 'आपातकालीन मदद', call: 'एम्बुलेंस बुलाएं', firstAid: 'प्राथमिक उपचार' },
        common: { loading: 'लोड हो रहा है...', error: 'कुछ गलत हो गया', retry: 'फिर से कोशिश करें', offline: 'आप ऑफ़लाइन हैं', back: 'वापस', save: 'सेव करें', cancel: 'रद्द करें' },
        onboarding: { welcome: 'सेहतसाथी में आपका स्वागत है', chooseLanguage: 'अपनी भाषा चुनें', continue: 'आगे बढ़ें' },
        home: { hero: 'सबके लिए AI स्वास्थ्य सेवा', heroSub: 'अपनी भाषा में आवाज़ से स्वास्थ्य सलाह पाएं', features: 'सुविधाएं', voiceDoc: 'आवाज़ से AI डॉक्टर', voiceDocDesc: 'लक्षण बोलें, सलाह सुनें', multiLang: '8 भारतीय भाषाएं', multiLangDesc: 'हिंदी, तमिल, बंगाली और अन्य में', phcFind: 'नजदीकी PHC खोजें', phcFindDesc: 'सरकारी स्वास्थ्य केंद्र का पता लगाएं', mlPredict: 'AI रोग भविष्यवाणी', mlPredictDesc: 'ML आधारित लक्षण विश्लेषण', stats: { languages: '8 भाषाएं', patients: '24/7 उपलब्ध', accuracy: 'AI संचालित', offline: 'ऑफलाइन तैयार' } },
        hospitals: { title: 'अस्पताल खोजें', allHospitals: 'सभी अस्पताल', govPHC: 'सरकारी PHC', nearest: 'सबसे नजदीक', distance: 'दूरी', directions: 'दिशा-निर्देश', call: 'कॉल करें', services: 'सेवाएं', hours: 'समय' },
        prescription: { title: 'प्रिस्क्रिप्शन', upload: 'प्रिस्क्रिप्शन अपलोड', explain: 'दवा की जानकारी', listen: 'सुनें', timing: 'समय', withFood: 'खाने के बाद', emptyStomach: 'खाली पेट', warnings: 'चेतावनी', avoid: 'बचें' },
        predict: { title: 'लक्षण जांच', subtitle: 'AI विश्लेषण के लिए अपने लक्षण चुनें', analyze: 'लक्षण जांचें', result: 'भविष्यवाणी परिणाम', confidence: 'विश्वास', explanation: 'AI व्याख्या' }
    },
    bn: {
        app: { name: 'সেহতসাথী', tagline: 'আপনার AI স্বাস্থ্য সঙ্গী' },
        nav: { dashboard: 'হোম', chat: 'AI ডাক্তার', predict: 'লক্ষণ পরীক্ষা', prescription: 'প্রেসক্রিপশন', health: 'স্বাস্থ্য রেকর্ড', hospitals: 'কাছের PHC', emergency: 'জরুরি SOS', profile: 'প্রোফাইল' },
        chat: { title: 'AI ডাক্তারের সাথে কথা বলুন', subtitle: 'আপনার ভাষায় লক্ষণ বলুন', placeholder: 'আপনার লক্ষণ লিখুন বা বলুন...', voiceHint: 'বলতে মাইক চাপুন', listening: 'শুনছি...', thinking: 'ভাবছি...', send: 'পাঠান' },
        voice: { speakNow: 'এখন বলুন...', tapToStop: 'থামাতে চাপুন', readAloud: 'পড়ে শোনান', stop: 'থামুন', speed: 'গতি' },
        emergency: { title: 'জরুরি সাহায্য', call: 'অ্যাম্বুলেন্স ডাকুন', firstAid: 'প্রাথমিক চিকিৎসা' },
        common: { loading: 'লোড হচ্ছে...', error: 'কিছু ভুল হয়েছে', retry: 'আবার চেষ্টা করুন', offline: 'আপনি অফলাইনে আছেন', back: 'পিছনে', save: 'সেভ করুন', cancel: 'বাতিল' },
        onboarding: { welcome: 'সেহতসাথীতে স্বাগতম', chooseLanguage: 'আপনার ভাষা বেছে নিন', continue: 'এগিয়ে যান' },
        home: { hero: 'সবার জন্য AI স্বাস্থ্যসেবা', heroSub: 'আপনার ভাষায় কণ্ঠস্বরে স্বাস্থ্য পরামর্শ নিন', features: 'সুবিধা', voiceDoc: 'কণ্ঠস্বর AI ডাক্তার', voiceDocDesc: 'লক্ষণ বলুন, পরামর্শ শুনুন', multiLang: '৮ ভারতীয় ভাষা', multiLangDesc: 'হিন্দি, তামিল, বাংলা ও আরো', phcFind: 'কাছের PHC খুঁজুন', phcFindDesc: 'সরকারি স্বাস্থ্যকেন্দ্র খুঁজুন', mlPredict: 'AI রোগ পূর্বাভাস', mlPredictDesc: 'ML ভিত্তিক লক্ষণ বিশ্লেষণ', stats: { languages: '৮ ভাষা', patients: '২৪/৭ উপলব্ধ', accuracy: 'AI চালিত', offline: 'অফলাইন প্রস্তুত' } },
        hospitals: { title: 'হাসপাতাল খুঁজুন', allHospitals: 'সব হাসপাতাল', govPHC: 'সরকারি PHC', nearest: 'সবচেয়ে কাছে', distance: 'দূরত্ব', directions: 'দিকনির্দেশ', call: 'কল করুন', services: 'সেবা', hours: 'সময়' },
        prescription: { title: 'প্রেসক্রিপশন', upload: 'প্রেসক্রিপশন আপলোড', explain: 'ওষুধের তথ্য', listen: 'শুনুন', timing: 'সময়', withFood: 'খাবারের পরে', emptyStomach: 'খালি পেটে', warnings: 'সতর্কতা', avoid: 'এড়িয়ে চলুন' },
        predict: { title: 'লক্ষণ পরীক্ষা', subtitle: 'AI বিশ্লেষণের জন্য আপনার লক্ষণ নির্বাচন করুন', analyze: 'লক্ষণ বিশ্লেষণ', result: 'পূর্বাভাস ফলাফল', confidence: 'আত্মবিশ্বাস', explanation: 'AI ব্যাখ্যা' }
    },
    ta: {
        app: { name: 'செகத்சாத்தி', tagline: 'உங்கள் AI சுகாதார தோழர்' },
        nav: { dashboard: 'முகப்பு', chat: 'AI மருத்துவர்', predict: 'அறிகுறி பரிசோதனை', prescription: 'மருந்து சீட்டு', health: 'சுகாதார பதிவுகள்', hospitals: 'அருகில் PHC', emergency: 'அவசர SOS', profile: 'சுயவிவரம்' },
        chat: { title: 'AI மருத்துவரிடம் பேசுங்கள்', subtitle: 'உங்கள் மொழியில் அறிகுறிகளை சொல்லுங்கள்', placeholder: 'அறிகுறிகளை தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்...', voiceHint: 'பேச மைக்கை அழுத்தவும்', listening: 'கேட்கிறேன்...', thinking: 'யோசிக்கிறேன்...', send: 'அனுப்பு' },
        voice: { speakNow: 'இப்போது பேசுங்கள்...', tapToStop: 'நிறுத்த அழுத்தவும்', readAloud: 'படித்துக் காட்டு', stop: 'நிறுத்து', speed: 'வேகம்' },
        emergency: { title: 'அவசர உதவி', call: 'ஆம்புலன்ஸ் அழைக்கவும்', firstAid: 'முதலுதவி' },
        common: { loading: 'ஏற்றுகிறது...', error: 'ஏதோ தவறு நடந்தது', retry: 'மீண்டும் முயற்சிக்கவும்', offline: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்', back: 'பின்னால்', save: 'சேமி', cancel: 'ரத்து' },
        onboarding: { welcome: 'செகத்சாத்தியில் வரவேற்கிறோம்', chooseLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்', continue: 'தொடரவும்' },
        home: { hero: 'அனைவருக்கும் AI சுகாதாரம்', heroSub: 'உங்கள் மொழியில் குரல் மூலம் சுகாதார ஆலோசனை', features: 'அம்சங்கள்', voiceDoc: 'குரல் AI மருத்துவர்', voiceDocDesc: 'அறிகுறிகளை சொல்லுங்கள், ஆலோசனை கேளுங்கள்', multiLang: '8 இந்திய மொழிகள்', multiLangDesc: 'இந்தி, தமிழ், வங்காளம் மற்றும் பல', phcFind: 'அருகிலுள்ள PHC', phcFindDesc: 'அரசு சுகாதார மையங்களை கண்டறியவும்', mlPredict: 'AI நோய் கணிப்பு', mlPredictDesc: 'ML அடிப்படையிலான அறிகுறி பகுப்பாய்வு', stats: { languages: '8 மொழிகள்', patients: '24/7 கிடைக்கும்', accuracy: 'AI இயக்கம்', offline: 'ஆஃப்லைன் தயார்' } },
        hospitals: { title: 'மருத்துவமனை தேடுங்கள்', allHospitals: 'அனைத்து மருத்துவமனைகள்', govPHC: 'அரசு PHC', nearest: 'அருகிலுள்ள', distance: 'தூரம்', directions: 'வழிகாட்டுதல்', call: 'அழைக்கவும்', services: 'சேவைகள்', hours: 'நேரம்' },
        prescription: { title: 'மருந்து சீட்டு', upload: 'மருந்து சீட்டு பதிவேற்றம்', explain: 'மருந்து விளக்கம்', listen: 'கேளுங்கள்', timing: 'நேரம்', withFood: 'உணவுக்குப் பின்', emptyStomach: 'வெறும் வயிற்றில்', warnings: 'எச்சரிக்கைகள்', avoid: 'தவிர்க்கவும்' },
        predict: { title: 'அறிகுறி பரிசோதனை', subtitle: 'AI பகுப்பாய்வுக்கு அறிகுறிகளை தேர்ந்தெடுக்கவும்', analyze: 'அறிகுறிகளை பகுப்பாய்வு செய்', result: 'கணிப்பு முடிவு', confidence: 'நம்பகத்தன்மை', explanation: 'AI விளக்கம்' }
    },
    te: {
        app: { name: 'సెహత్సాథీ', tagline: 'మీ AI ఆరోగ్య సహచరుడు' },
        nav: { dashboard: 'హోమ్', chat: 'AI డాక్టర్', predict: 'లక్షణాల పరీక్ష', prescription: 'ప్రిస్క్రిప్షన్', health: 'ఆరోగ్య రికార్డులు', hospitals: 'సమీపంలో PHC', emergency: 'అత్యవసర SOS', profile: 'ప్రొఫైల్' },
        chat: { title: 'AI డాక్టర్తో మాట్లాడండి', subtitle: 'మీ భాషలో లక్షణాలు చెప్పండి', placeholder: 'మీ లక్షణాలను టైప్ చేయండి లేదా చెప్పండి...', voiceHint: 'మాట్లాడటానికి మైక్ నొక్కండి', listening: 'వింటున్నాను...', thinking: 'ఆలోచిస్తున్నాను...', send: 'పంపు' },
        voice: { speakNow: 'ఇప్పుడు మాట్లాడండి...', tapToStop: 'ఆపడానికి నొక్కండి', readAloud: 'చదివి వినిపించు', stop: 'ఆపు', speed: 'వేగం' },
        emergency: { title: 'అత్యవసర సహాయం', call: 'అంబులెన్స్ పిలవండి', firstAid: 'ప్రథమ చికిత్స' },
        common: { loading: 'లోడ్ అవుతోంది...', error: 'ఏదో తప్పు జరిగింది', retry: 'మళ్ళీ ప్రయత్నించండి', offline: 'మీరు ఆఫ్లైన్లో ఉన్నారు', back: 'వెనుకకు', save: 'సేవ్', cancel: 'రద్దు' },
        onboarding: { welcome: 'సెహత్సాథీకి స్వాగతం', chooseLanguage: 'మీ భాషను ఎంచుకోండి', continue: 'కొనసాగించు' },
        home: { hero: 'అందరికీ AI ఆరోగ్య సేవ', heroSub: 'మీ భాషలో వాయిస్ ద్వారా ఆరోగ్య సలహా పొందండి', features: 'సౌకర్యాలు', voiceDoc: 'వాయిస్ AI డాక్టర్', voiceDocDesc: 'లక్షణాలు చెప్పండి, సలహા వినండి', multiLang: '8 భారతీయ భాషలు', multiLangDesc: 'హిందీ, తమిళం, బెంగాలీ మరియు మరిన్ని', phcFind: 'సమీపంలోని PHC', phcFindDesc: 'ప్రభుత్వ ఆరోగ్య కేంద్రాలను కనుగొనండి', mlPredict: 'AI వ్యాధి అంచనా', mlPredictDesc: 'ML ఆధారిత లక్షణ విశ్లేషణ', stats: { languages: '8 భాషలు', patients: '24/7 అందుబాటు', accuracy: 'AI ఆధారిత', offline: 'ఆఫ్లైన్ సిద్ధం' } },
        hospitals: { title: 'ఆసుపత్రులు కనుగొనండి', allHospitals: 'అన్ని ఆసుపత్రులు', govPHC: 'ప్రభుత్వ PHC', nearest: 'సమీపంలోని', distance: 'దూరం', directions: 'దిశలు', call: 'కాల్ చేయండి', services: 'సేవలు', hours: 'సమయం' },
        prescription: { title: 'ప్రిస్క్రిప్షన్', upload: 'ప్రిస్క్రిప్షన్ అప్లోడ్', explain: 'మందు వివరణ', listen: 'వినండి', timing: 'సమయం', withFood: 'భోజనం తర్వాత', emptyStomach: 'ఖాళీ కడుపుతో', warnings: 'హెచ్చరికలు', avoid: 'నివారించండి' },
        predict: { title: 'లక్షణాల పరీక్ష', subtitle: 'AI విశ్లేషణ కోసం మీ లక్షణాలను ఎంచుకోండి', analyze: 'లక్షణాలను విశ్లేషించు', result: 'అంచనా ఫలితం', confidence: 'విశ్వాసం', explanation: 'AI వివరణ' }
    },
    mr: {
        app: { name: 'सेहतसाथी', tagline: 'तुमचा AI आरोग्य साथी' },
        nav: { dashboard: 'होम', chat: 'AI डॉक्टर', predict: 'लक्षणे तपासा', prescription: 'प्रिस्क्रिप्शन', health: 'आरोग्य नोंदी', hospitals: 'जवळचे PHC', emergency: 'आपत्कालीन SOS', profile: 'प्रोफाइल' },
        chat: { title: 'AI डॉक्टरशी बोला', subtitle: 'तुमच्या भाषेत लक्षणे सांगा', placeholder: 'तुमची लक्षणे लिहा किंवा बोला...', voiceHint: 'बोलण्यासाठी माइक दाबा', listening: 'ऐकतोय...', thinking: 'विचार करतोय...', send: 'पाठवा' },
        voice: { speakNow: 'आता बोला...', tapToStop: 'थांबवण्यासाठी दाबा', readAloud: 'वाचून दाखवा', stop: 'थांबा', speed: 'वेग' },
        emergency: { title: 'आपत्कालीन मदत', call: 'रुग्णवाहिका बोलवा', firstAid: 'प्रथमोपचार' },
        common: { loading: 'लोड होतंय...', error: 'काहीतरी चूक झाली', retry: 'पुन्हा प्रयत्न करा', offline: 'तुम्ही ऑफलाइन आहात', back: 'मागे', save: 'सेव्ह करा', cancel: 'रद्द करा' },
        onboarding: { welcome: 'सेहतसाथीमध्ये स्वागत', chooseLanguage: 'तुमची भाषा निवडा', continue: 'पुढे जा' },
        home: { hero: 'सर्वांसाठी AI आरोग्य सेवा', heroSub: 'तुमच्या भाषेत आवाजाने आरोग्य सल्ला घ्या', features: 'वैशिष्ट्ये', voiceDoc: 'आवाज AI डॉक्टर', voiceDocDesc: 'लक्षणे सांगा, सल्ला ऐका', multiLang: '८ भारतीय भाषा', multiLangDesc: 'हिंदी, तमिळ, बंगाली आणि अधिक', phcFind: 'जवळचे PHC शोधा', phcFindDesc: 'सरकारी आरोग्य केंद्रे शोधा', mlPredict: 'AI रोग अंदाज', mlPredictDesc: 'ML आधारित लक्षण विश्लेषण', stats: { languages: '८ भाषा', patients: '२४/७ उपलब्ध', accuracy: 'AI चालित', offline: 'ऑफलाइन तयार' } },
        hospitals: { title: 'रुग्णालये शोधा', allHospitals: 'सर्व रुग्णालये', govPHC: 'सरकारी PHC', nearest: 'सर्वात जवळ', distance: 'अंतर', directions: 'दिशा', call: 'कॉल करा', services: 'सेवा', hours: 'वेळ' },
        prescription: { title: 'प्रिस्क्रिप्शन', upload: 'प्रिस्क्रिप्शन अपलोड', explain: 'औषध माहिती', listen: 'ऐका', timing: 'वेळ', withFood: 'जेवणानंतर', emptyStomach: 'रिकाम्या पोटी', warnings: 'सावधानता', avoid: 'टाळा' },
        predict: { title: 'लक्षणे तपासा', subtitle: 'AI विश्लेषणासाठी तुमची लक्षणे निवडा', analyze: 'लक्षणे तपासा', result: 'अंदाज निकाल', confidence: 'विश्वास', explanation: 'AI स्पष्टीकरण' }
    },
    gu: {
        app: { name: 'સેહતસાથી', tagline: 'તમારો AI આરોગ્ય સાથી' },
        nav: { dashboard: 'હોમ', chat: 'AI ડૉક્ટર', predict: 'લક્ષણો તપાસો', prescription: 'પ્રિસ્ક્રિપ્શન', health: 'આરોગ્ય રેકોર્ડ', hospitals: 'નજીકનું PHC', emergency: 'ઇમરજન્સી SOS', profile: 'પ્રોફાઇલ' },
        chat: { title: 'AI ડૉક્ટર સાથે વાત કરો', subtitle: 'તમારી ભાષામાં લક્ષણો જણાવો', placeholder: 'તમારા લક્ષણો લખો અથવા બોલો...', voiceHint: 'બોલવા માટે માઇક દબાવો', listening: 'સાંભળી રહ્યા છીએ...', thinking: 'વિચારી રહ્યા છીએ...', send: 'મોકલો' },
        voice: { speakNow: 'હવે બોલો...', tapToStop: 'રોકવા માટે દબાવો', readAloud: 'વાંચીને સંભળાવો', stop: 'રોકો', speed: 'ઝડપ' },
        emergency: { title: 'ઇમરજન્સી મદદ', call: 'એમ્બ્યુલન્સ બોલાવો', firstAid: 'પ્રાથમિક સારવાર' },
        common: { loading: 'લોડ થઈ રહ્યું છે...', error: 'કંઈક ખોટું થયું', retry: 'ફરી પ્રયત્ન કરો', offline: 'તમે ઑફલાઇન છો', back: 'પાછા', save: 'સેવ કરો', cancel: 'રદ કરો' },
        onboarding: { welcome: 'સેહતસાથીમાં સ્વાગત છે', chooseLanguage: 'તમારી ભાષા પસંદ કરો', continue: 'આગળ વધો' },
        home: { hero: 'બધા માટે AI આરોગ્ય સેવા', heroSub: 'તમારી ભાષામાં અવાજથી આરોગ્ય સલાહ મેળવો', features: 'સુવિધાઓ', voiceDoc: 'અવાજ AI ડૉક્ટર', voiceDocDesc: 'લક્ષણો બોલો, સલાહ સાંભળો', multiLang: '8 ભારતીય ભાષાઓ', multiLangDesc: 'હિન્દી, તમિલ, બંગાળી અને વધુ', phcFind: 'નજીકનું PHC શોધો', phcFindDesc: 'સરકારી આરોગ્ય કેન્દ્રો શોધો', mlPredict: 'AI રોગ અનુમાન', mlPredictDesc: 'ML આધારિત લક્ષણ વિશ્લેષણ', stats: { languages: '8 ભાષાઓ', patients: '24/7 ઉપલબ્ધ', accuracy: 'AI સંચાલિત', offline: 'ઑફલાઇન તૈયાર' } },
        hospitals: { title: 'હોસ્પિટલ શોધો', allHospitals: 'બધી હોસ્પિટલો', govPHC: 'સરકારી PHC', nearest: 'સૌથી નજીક', distance: 'અંતર', directions: 'દિશાઓ', call: 'કૉલ કરો', services: 'સેવાઓ', hours: 'સમય' },
        prescription: { title: 'પ્રિસ્ક્રિપ્શન', upload: 'પ્રિસ્ક્રિપ્શન અપલોડ', explain: 'દવાની માહિતી', listen: 'સાંભળો', timing: 'સમય', withFood: 'ભોજન પછી', emptyStomach: 'ખાલી પેટે', warnings: 'ચેતવણીઓ', avoid: 'ટાળો' },
        predict: { title: 'લક્ષણો તપાસો', subtitle: 'AI વિશ્લેષણ માટે તમારા લક્ષણો પસંદ કરો', analyze: 'લક્ષણો તપાસો', result: 'અનુમાન પરિણામ', confidence: 'વિશ્વાસ', explanation: 'AI સમજૂતી' }
    },
    kn: {
        app: { name: 'ಸೆಹತ್ಸಾಥಿ', tagline: 'ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಂಗಾತಿ' },
        nav: { dashboard: 'ಹೋಮ್', chat: 'AI ವೈದ್ಯ', predict: 'ಲಕ್ಷಣ ಪರೀಕ್ಷೆ', prescription: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್', health: 'ಆರೋಗ್ಯ ದಾಖಲೆಗಳು', hospitals: 'ಹತ್ತಿರದ PHC', emergency: 'ತುರ್ತು SOS', profile: 'ಪ್ರೊಫೈಲ್' },
        chat: { title: 'AI ವೈದ್ಯರ ಜೊತೆ ಮಾತನಾಡಿ', subtitle: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಲಕ್ಷಣಗಳನ್ನು ಹೇಳಿ', placeholder: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಹೇಳಿ...', voiceHint: 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ', listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...', thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...', send: 'ಕಳುಹಿಸಿ' },
        voice: { speakNow: 'ಈಗ ಮಾತನಾಡಿ...', tapToStop: 'ನಿಲ್ಲಿಸಲು ಒತ್ತಿ', readAloud: 'ಓದಿ ಹೇಳಿ', stop: 'ನಿಲ್ಲಿಸಿ', speed: 'ವೇಗ' },
        emergency: { title: 'ತುರ್ತು ಸಹಾಯ', call: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆಯಿರಿ', firstAid: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ' },
        common: { loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', error: 'ಏನೋ ತಪ್ಪಾಗಿದೆ', retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', offline: 'ನೀವು ಆಫ್ಲೈನ್ನಲ್ಲಿದ್ದೀರಿ', back: 'ಹಿಂದೆ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದು' },
        onboarding: { welcome: 'ಸೆಹತ್ಸಾಥಿಗೆ ಸ್ವಾಗತ', chooseLanguage: 'ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ', continue: 'ಮುಂದುವರಿಸಿ' },
        home: { hero: 'ಎಲ್ಲರಿಗೂ AI ಆರೋಗ್ಯ ಸೇವೆ', heroSub: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿಯ ಮೂಲಕ ಆರೋಗ್ಯ ಸಲಹೆ ಪಡೆಯಿರಿ', features: 'ವೈಶಿಷ್ಟ್ಯಗಳು', voiceDoc: 'ಧ್ವನಿ AI ವೈದ್ಯ', voiceDocDesc: 'ಲಕ್ಷಣಗಳನ್ನು ಹೇಳಿ, ಸಲಹೆ ಕೇಳಿ', multiLang: '8 ಭಾರತೀಯ ಭಾಷೆಗಳು', multiLangDesc: 'ಹಿಂದಿ, ತಮಿಳು, ಬೆಂಗಾಲಿ ಮತ್ತು ಹೆಚ್ಚು', phcFind: 'ಹತ್ತಿರದ PHC ಹುಡುಕಿ', phcFindDesc: 'ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳನ್ನು ಹುಡುಕಿ', mlPredict: 'AI ರೋಗ ಊಹೆ', mlPredictDesc: 'ML ಆಧಾರಿತ ಲಕ್ಷಣ ವಿಶ್ಲೇಷಣೆ', stats: { languages: '8 ಭಾಷೆಗಳು', patients: '24/7 ಲಭ್ಯ', accuracy: 'AI ಚಾಲಿತ', offline: 'ಆಫ್ಲೈನ್ ಸಿದ್ಧ' } },
        hospitals: { title: 'ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ', allHospitals: 'ಎಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳು', govPHC: 'ಸರ್ಕಾರಿ PHC', nearest: 'ಹತ್ತಿರದ', distance: 'ದೂರ', directions: 'ದಿಕ್ಕುಗಳು', call: 'ಕರೆ ಮಾಡಿ', services: 'ಸೇವೆಗಳು', hours: 'ಸಮಯ' },
        prescription: { title: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್', upload: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಪ್ಲೋಡ್', explain: 'ಔಷಧ ವಿವರಣೆ', listen: 'ಕೇಳಿ', timing: 'ಸಮಯ', withFood: 'ಊಟದ ನಂತರ', emptyStomach: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ', warnings: 'ಎಚ್ಚರಿಕೆಗಳು', avoid: 'ತಪ್ಪಿಸಿ' },
        predict: { title: 'ಲಕ್ಷಣ ಪರೀಕ್ಷೆ', subtitle: 'AI ವಿಶ್ಲೇಷಣೆಗಾಗಿ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ', analyze: 'ಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ', result: 'ಊಹೆ ಫಲಿತಾಂಶ', confidence: 'ವಿಶ್ವಾಸ', explanation: 'AI ವಿವರಣೆ' }
    }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const saved = localStorage.getItem('sehat_saathi_lang');
        return saved ? LANGUAGES.find(l => l.code === saved) || LANGUAGES[0] : LANGUAGES[0];
    });
    const [isFirstVisit, setIsFirstVisit] = useState(() => !localStorage.getItem('sehat_saathi_lang'));

    const changeLanguage = (langCode) => {
        const lang = LANGUAGES.find(l => l.code === langCode);
        if (lang) {
            setCurrentLanguage(lang);
            localStorage.setItem('sehat_saathi_lang', langCode);
            document.documentElement.lang = langCode;
        }
    };

    const completeOnboarding = () => setIsFirstVisit(false);

    useEffect(() => { document.documentElement.lang = currentLanguage.code; }, [currentLanguage]);

    const t = (key) => {
        try {
            const translations = translationMap[currentLanguage.code] || translationMap.en;
            const keys = key.split('.');
            let result = translations;
            for (const k of keys) { result = result?.[k]; }
            return result || key;
        } catch { return key; }
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages: LANGUAGES, isFirstVisit, completeOnboarding, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be inside LanguageProvider');
    return context;
};

export { LANGUAGES };
