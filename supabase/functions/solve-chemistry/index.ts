
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, language } = await req.json()
    const targetLang = language || 'en';

    if (!imageBase64) {
      throw new Error('No image provided')
    }

    // Google Gemini Implementation
    const GEMINI_API_KEY = Deno.env.get('ChemSolver_GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Missing ChemSolver_GEMINI_API_KEY in environment variables')
    }

    // Call Gemini 3 Flash Preview
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are a Chemistry Expert AI Helper. 

TASK 1: STRICT RELEVANCE CHECK.
Analyze the image. Is it explicitly related to CHEMISTRY?

ACCEPTABLE: Chemical equations, molecular formulas, periodic table, structural formulas, stoichiometry, lab equipment, reaction mechanisms.

FORBIDDEN: General Math (algebra, calculus not in chem context), Physics (kinematics, etc), Philosophy, History, Literature, Biology (unless biochemistry), Selfies, Scenery, or ANY other non-chemistry topic.

IF IT IS NOT PURE CHEMISTRY:
Return strictly this JSON:
{
  "question": "Topic not supported",
  "answer": "Chemistry Only",
  "steps": ["Please upload a valid chemistry problem."],
  "explanation": "This app is designed exclusively for Chemistry learning. I cannot assist with Math, Philosophy, or other subjects."
}

IF IT IS CHEMISTRY:
Solve it and return a JSON with this structure. 
IMPORTANT: Translate the 'explanation' and 'steps' to the language code: '${targetLang}'.

{
  "question": "(Extracted text/formula)",
  "answer": "(THE FINAL RESULT ONLY. Concise and direct. e.g. 'x = 5', 'H₂O', '15.99 g/mol'. Do NOT include explanation here.)",
  "steps": [
    "Step 1: Introduction to the concept (in ${targetLang}). Explain what we are looking for.",
    "Step 2: Setup (in ${targetLang}). Show the formula or equation used.",
    "Step 3: Calculation/Process (in ${targetLang}). Show the intermediate math or logic.",
    "Step 4: Conclusion (in ${targetLang}). Explain why this is the result to help the user learn."
  ], 
  "explanation": "(A brief summary of the topic in ${targetLang})"
}` },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    })

    const aiData = await response.json()

    if (aiData.error) {
      throw new Error(aiData.error.message || 'Gemini API Error')
    }

    // Gemini response structure parsing
    // With response_mime_type="application/json", the text should be valid JSON.
    let content = "";
    let result;

    try {
      if (aiData.candidates && aiData.candidates[0] && aiData.candidates[0].content && aiData.candidates[0].content.parts) {
        content = aiData.candidates[0].content.parts[0].text;
        result = JSON.parse(content);
      } else {
        throw new Error("Unexpected Gemini response structure");
      }
    } catch (e) {
      console.error("Gemini Parsing Error", e);
      // Fallback if parsing fails or structure is unexpected
      result = {
        question: "Error Analyzing Image",
        answer: "Could not parse AI response",
        steps: ["Check logs for details"],
        explanation: `Raw AI response: ${JSON.stringify(aiData)}`
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
