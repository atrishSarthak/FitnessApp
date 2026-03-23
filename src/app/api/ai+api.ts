import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD_OZzEPzzVmaEu8tUkM3PJgDH3keYNcFg";

export async function POST(request: Request) {
    try {
        const { exerciseName } = await request.json();

        if (!exerciseName) {
            return Response.json(
                { error: "Exercise name is required" },
                { status: 400 }
            )
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const prompt = `
You are a no-fluff fitness coach. Respond ONLY for: ${exerciseName}

Rules:
- Max 2 bullet points per section
- Each bullet max 10 words
- No filler words, no motivational speeches

Start with 2 energetic sentences: what this exercise does for your body and why it's worth doing.

## Equipment
## Form (3 key steps only)
## Reps & Sets
## Mistakes to Avoid
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const response = await result.response;
        console.log("AI Response:", response.text());
        return Response.json({ message: response.text() });

    } catch (error) {
        console.error("Error in AI API:", error);
        return Response.json(
            { error: "Error fetching AI guidance", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}