import fs from 'fs';
import path from 'path';

// 多模态模型用于图文审核
const VISION_MODEL_ID = process.env.GLM_VISION_MODEL_ID || 'Qwen3-VL-30B-A3B-Thinking';
// 纯文本模型作为备选
const TEXT_MODEL_ID = process.env.GLM_MODEL_ID || 'DeepSeek-V3.1';
const BASE_URL = process.env.GLM_BASE_URL || 'https://llmapi.paratera.com';
const CHAT_PATH = '/chat/completions';
const API_ENDPOINT = `${BASE_URL.replace(/\/$/, '')}${CHAT_PATH}`;

function ensureApiKey() {
  if (!process.env.GLM_API_KEY) {
    throw new Error('GLM_API_KEY is not configured');
  }
}

// 将本地图片转为 base64
function imageToBase64(imagePath) {
  try {
    // 处理相对路径，假设图片在 backend/memefiles 目录下
    let fullPath = imagePath;
    // 删去开头的/api
    if (imagePath.startsWith('/api/')) {
      imagePath = imagePath.replace('/api/', '/');
    }
    if (imagePath.startsWith('/memefiles/')) {
      fullPath = path.join(process.cwd(), imagePath);
    } else if (!path.isAbsolute(imagePath)) {
      fullPath = path.join(process.cwd(), 'memefiles', imagePath);
    }
    
    if (!fs.existsSync(fullPath)) {
      console.log('[AI Audit] Image file not found:', fullPath);
      return null;
    }
    
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    
    // 根据文件扩展名确定 MIME 类型
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error('[AI Audit] Error reading image:', err.message);
    return null;
  }
}

function buildTextPrompt(meme = {}) {
  const fields = [
    `标题: ${meme.title || '无'}`,
    `描述: ${meme.description || '无'}`,
    `创建时间: ${meme.createdAt ? new Date(meme.createdAt).toISOString() : '未知'}`,
    `作者: ${meme.author?.username || '未知'}`,
  ].filter(Boolean).join('\n');

  return `你是一个内容安全审核智能体，需要对用户提交的模因（包括图片和文字）进行合规审查。
请根据以下维度判断：政治敏感、暴恐、违禁、色情、辱骂歧视、侵权抄袭、恶意营销以及其他违规。

请同时审核图片内容和文字内容，做出综合审核建议，并输出 JSON（不要加入额外文本），格式如下：
{
  "decision": "approve" 或 "reject" 或 "manual_review",
  "riskScore": 0到1之间的小数,
  "reasons": ["原因1", "原因2"],
  "summary": "对模因内容（图片+文字）的简要总结"
}

文字信息：
${fields}

请仔细审核上方的图片内容，结合文字信息给出审核结论。`;
}

export async function runAIAudit(meme) {
  ensureApiKey();

  const prompt = buildTextPrompt(meme);
  
  // 尝试将图片转为 base64
  let imageBase64 = null;
  if (meme.imageUrl && meme.imageUrl.trim() !== '') {
    // 从 URL 中提取路径部分
    let imagePath = meme.imageUrl;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // 提取路径部分，如 http://localhost:3000/memefiles/xxx.jpg -> /memefiles/xxx.jpg
      try {
        const url = new URL(imagePath);
        imagePath = url.pathname;
      } catch (e) {
        // 保持原样
      }
    }
    imageBase64 = imageToBase64(imagePath);
  }
  
  const hasImage = !!imageBase64;

  let body;
  if (hasImage) {
    // 使用多模态模型，同时审核图片和文字
    body = {
      model: VISION_MODEL_ID,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };
  } else {
    // 无图片时使用纯文本模型
    body = {
      model: TEXT_MODEL_ID,
      temperature: 0.2,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: '你是内容审核专家，请严格按照要求输出 JSON。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };
  }

  console.log('[AI Audit] Using model:', hasImage ? VISION_MODEL_ID : TEXT_MODEL_ID);
  console.log('[AI Audit] Has image:', hasImage);
  console.log('[AI Audit] Image path:', meme.imageUrl);
  console.log('[AI Audit] Sending request to:', API_ENDPOINT);

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[AI Audit] API error:', response.status, text);
    throw new Error(`GLM 审核接口调用失败: ${response.status} ${text}`);
  }

  const data = await response.json();
  console.log('[AI Audit] Full API response:', JSON.stringify(data, null, 2));
  
  const rawContent = data?.choices?.[0]?.message?.content?.trim();
  console.log('[AI Audit] Raw content:', rawContent);

  let parsed = null;
  if (rawContent) {
    // 先尝试清理可能的 markdown 代码块
    let cleaned = rawContent;
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      parsed = JSON.parse(cleaned);
      console.log('[AI Audit] Parsed successfully:', parsed);
    } catch (err) {
      console.log('[AI Audit] Direct parse failed, trying regex extraction');
      // 尝试提取 JSON
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
          console.log('[AI Audit] Regex extraction succeeded:', parsed);
        } catch (_) {
          console.log('[AI Audit] Regex extraction also failed');
          parsed = { 
            decision: 'manual_review', 
            summary: cleaned,
            reasons: ['AI 返回内容无法解析为 JSON'],
            riskScore: 0.5
          };
        }
      } else {
        parsed = { 
          decision: 'manual_review', 
          summary: cleaned || 'AI 未返回有效内容',
          reasons: ['AI 返回内容不包含 JSON 对象'],
          riskScore: 0.5
        };
      }
    }
  } else {
    console.log('[AI Audit] No content in response');
    parsed = {
      decision: 'manual_review',
      summary: 'AI 未返回任何内容',
      reasons: ['API 响应中没有 content 字段'],
      riskScore: 0.5
    };
  }

  return {
    raw: rawContent || '',
    parsed,
  };
}

