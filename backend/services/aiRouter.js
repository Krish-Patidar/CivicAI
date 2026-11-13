const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const Department = require('../models/Department');

const MODEL = process.env.GEMINI_ROUTER_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = 15000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CATEGORIES = ['road', 'garbage', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'other'];
const PRIORITIES = ['high', 'medium', 'low'];
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif'
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI routing timed out')), ms))
  ]);

const routeComplaint = async ({ title, description, imagePath }) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

  const departments = (await Department.find({ isActive: true })).filter(d => d.code);
  if (!departments.length) throw new Error('No active departments');

  const deptList = departments
    .map(d => `- ${d.code}: ${d.name}. Categories: ${(d.categories || []).join(', ')}. ${d.description || ''}`)
    .join('\n');

  const systemInstruction = `You route citizen complaints for an Indian municipal grievance portal.
Choose the department that must physically fix the problem. Judge mainly from the title and the core problem; ignore background details such as why an area is popular or crowded.
Examples: "street light not working" -> electricity (NOT road). "pothole on main road" -> road. "overflowing drain" -> water or sanitation.
High priority = risk to life or safety, or a long outage or failure in a busy public area. Low = minor or cosmetic.
If an image is attached, use it as supporting evidence. Set imageMatchesText to false only if the image is clearly unrelated to the complaint text (for example a selfie, a meme or a screenshot). If there is no image, set it to true.
Use a confidence below 0.6 if the text is vague or the text and image disagree.

Departments:
${deptList}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING, format: 'enum', enum: CATEGORIES },
          departmentCode: { type: SchemaType.STRING, format: 'enum', enum: departments.map(d => d.code) },
          priority: { type: SchemaType.STRING, format: 'enum', enum: PRIORITIES },
          confidence: { type: SchemaType.NUMBER },
          imageMatchesText: { type: SchemaType.BOOLEAN },
          reason: { type: SchemaType.STRING }
        },
        required: ['category', 'departmentCode', 'priority', 'confidence', 'imageMatchesText', 'reason']
      }
    }
  });

  const parts = [{ text: `Title: ${title}\nDescription: ${description}` }];

  if (imagePath) {
    try {
      const ext = path.extname(imagePath).toLowerCase();
      if (MIME[ext] && fs.statSync(imagePath).size <= MAX_IMAGE_BYTES) {
        parts.push({
          inlineData: { mimeType: MIME[ext], data: fs.readFileSync(imagePath).toString('base64') }
        });
      }
    } catch (e) {
      console.log('Could not read image for AI routing:', e.message);
    }
  }

  const isRetryable = (e) =>
    /503|429|overloaded|high demand|timed out|fetch failed|ECONNRESET|ETIMEDOUT/i.test(String(e && e.message));

  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await withTimeout(model.generateContent({ contents: [{ role: 'user', parts }] }), TIMEOUT_MS);
      break;
    } catch (e) {
      if (attempt === 3 || !isRetryable(e)) throw e;
      console.log(`Gemini attempt ${attempt} failed (${String(e.message).slice(0, 90)}). Retrying...`);
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  
  let out;
  try {
    out = JSON.parse(result.response.text());
  } catch (e) {
    throw new Error('AI returned invalid JSON');
  }

  // Validate before trusting
  if (!CATEGORIES.includes(out.category)) throw new Error('AI returned unknown category');
  if (!departments.some(d => d.code === out.departmentCode)) out.departmentCode = null;
  if (!PRIORITIES.includes(out.priority)) out.priority = 'medium';
  out.confidence = Math.min(Math.max(Number(out.confidence) || 0, 0), 1);
  out.imageMatchesText = out.imageMatchesText !== false;
  out.reason = String(out.reason || '').slice(0, 300);

  return { ...out, source: 'ai' };
};

module.exports = { routeComplaint };