export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Lấy API Key từ Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in environment variables' });
    }

    try {
        const userMessage = req.body.message;

        // Bối cảnh để AI trả lời đúng trọng tâm Logistics BSR
        const systemPrompt = "Bạn là chuyên gia Logistics tại BSR (Lọc hóa dầu Bình Sơn). Hãy trả lời ngắn gọn, súc tích, chuyên nghiệp các câu hỏi về logistics, thuê tàu, giá dầu, Incoterms. Nếu không biết thì nói không biết.";
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nỨng viên hỏi: ${userMessage}` }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ reply: aiText });
    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ error: 'Lỗi khi gọi AI' });
    }
}
