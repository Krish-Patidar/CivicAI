require('dotenv').config();

(async () => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    if (!res.ok) return console.error('ERROR:', data.error?.message || data);
    data.models
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .forEach(m => console.log(m.name.replace('models/', '')));
  } catch (e) {
    console.error(e.message);
  }
})();
