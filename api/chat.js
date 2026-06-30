export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in environment variables' });
    }

    try {
        const userMessage = req.body.message;

        const systemPrompt = "Bạn là chuyên gia Logistics tại BSR (Lọc hóa dầu Bình Sơn). Hãy trả lời ngắn gọn, súc tích, chuyên nghiệp các câu hỏi về logistics, thuê tàu, giá dầu, Incoterms. Nếu không biết thì nói không biết.";

        // Thử tối đa 3 lần, mỗi lần cách nhau 1-2 giây
        const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
        let lastError = null;

        for (const model of models) {
            for (let attempt = 0; attempt < 2; attempt++) {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${systemPrompt}\n\nỨng viên hỏi: ${userMessage}` }] }]
                        })
                    }
                );

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
                }

                lastError = data.error?.message || response.statusText;

                // Nếu lỗi overload thì đợi 1.5s rồi thử lại
                if (response.status === 429 || response.status === 503) {
                    await new Promise(r => setTimeout(r, 1500));
                    continue;
                }

                // Lỗi khác (sai key, model ko tồn tại) -> bỏ qua model này
                break;
            }
        }

        return res.status(500).json({
            error: `AI đang quá tải, vui lòng thử lại sau vài giây. (${lastError})`
        });

    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ error: error.message || 'Lỗi hệ thống khi gọi AI' });
    }
}
