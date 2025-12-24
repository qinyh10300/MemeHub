import fs from 'fs';
import path from 'path';
import * as Const from '../configs/const.js';

const STICKER_PROVIDER = (process.env.STICKER_PROVIDER || '').toLowerCase();
const isSiliconFlowProvider = STICKER_PROVIDER === 'siliconflow' || STICKER_PROVIDER === 'kolors';

const STICKER_PLAN_MODEL_ID =
  process.env.STICKER_PLAN_MODEL_ID ||
  process.env.GLM_MODEL_ID ||
  (isSiliconFlowProvider ? 'Qwen/Qwen2.5-7B-Instruct' : 'DeepSeek-V3.1');
const STICKER_FALLBACK_MODEL_ID =
  process.env.STICKER_FALLBACK_MODEL_ID ||
  (isSiliconFlowProvider ? 'Qwen/Qwen2.5-7B-Instruct' : 'DeepSeek-V3.1');
const STICKER_MODEL_ID = process.env.STICKER_MODEL_ID || 'WanX2.1-T2I-Turbo';
const DEFAULT_BASE_URL = isSiliconFlowProvider ? 'https://api.siliconflow.cn/v1' : 'https://llmapi.paratera.com/v1';
const RAW_BASE_URL = process.env.STICKER_API_BASE_URL || process.env.GLM_BASE_URL || DEFAULT_BASE_URL;
const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const stripVersionSuffix = (value = '') => value.replace(/\/v1$/i, '');
const BASE_URL = stripTrailingSlash(RAW_BASE_URL);
const normalizePath = (segment = '') => (segment && segment.startsWith('/') ? segment : `/${segment || ''}`);
const CHAT_PATH = process.env.STICKER_CHAT_PATH || '/chat/completions';
const DEFAULT_IMAGE_PATH = isSiliconFlowProvider ? '/images/generations' : '/v1/p003/text2image';
const STICKER_IMAGE_ENDPOINT = process.env.STICKER_IMAGE_ENDPOINT;
const RAW_IMAGE_BASE_URL = stripTrailingSlash(
  process.env.STICKER_IMAGE_BASE_URL || stripVersionSuffix(RAW_BASE_URL)
);
const IMAGE_PATH = process.env.STICKER_IMAGE_PATH || DEFAULT_IMAGE_PATH;
const CHAT_ENDPOINT = `${BASE_URL}${normalizePath(CHAT_PATH)}`;
const IMAGE_ENDPOINT = STICKER_IMAGE_ENDPOINT
  ? stripTrailingSlash(STICKER_IMAGE_ENDPOINT)
  : `${RAW_IMAGE_BASE_URL}${normalizePath(IMAGE_PATH)}`;
const STICKER_API_KEY = process.env.STICKER_API_KEY || process.env.GLM_API_KEY;
const STICKER_IMAGE_MODEL_ID =
  process.env.STICKER_IMAGE_MODEL_ID ||
  (isSiliconFlowProvider ? 'kolors' : STICKER_MODEL_ID);
const STICKER_IMAGE_PROVIDER =
  (process.env.STICKER_IMAGE_PROVIDER || (isSiliconFlowProvider ? 'siliconflow' : 'default')).toLowerCase();
const STICKER_IMAGE_API_STYLE =
  (process.env.STICKER_IMAGE_API_STYLE || (isSiliconFlowProvider ? 'openai' : 'default')).toLowerCase();
const STICKER_IMAGE_SIZE = process.env.STICKER_IMAGE_SIZE || (isSiliconFlowProvider ? '768x768' : '512x512');
const STICKER_SIMPLE_MODE =
  `${process.env.STICKER_USE_SIMPLE_IMAGE || ''}`.toLowerCase() === 'true' ||
  STICKER_IMAGE_API_STYLE === 'simple';
const parseOptionalNumber = (value, parser = (v) => parseFloat(v)) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = `${value}`.trim();
  if (!trimmed) return undefined;
  const parsed = parser(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const STICKER_IMAGE_NEG_PROMPT = process.env.STICKER_IMAGE_NEG_PROMPT || process.env.STICKER_NEGATIVE_PROMPT || '';
const STICKER_IMAGE_CFG = parseOptionalNumber(process.env.STICKER_IMAGE_CFG);
const STICKER_IMAGE_STEPS = parseOptionalNumber(process.env.STICKER_IMAGE_STEPS, (val) => parseInt(val, 10));
const STICKER_IMAGE_BATCH =
  parseOptionalNumber(process.env.STICKER_IMAGE_BATCH, (val) => parseInt(val, 10)) || 1;
const STICKER_IMAGE_RESPONSE_FORMAT = process.env.STICKER_IMAGE_RESPONSE_FORMAT || 'b64_json';
const STICKER_OUTPUT_DIR = path.join(process.cwd(), Const.STICKER_DIR);
const isOpenAIStyleImageApi = ['openai', 'siliconflow', 'kolors'].includes(STICKER_IMAGE_API_STYLE);

function ensureApiKey() {
  if (!STICKER_API_KEY) {
    throw new Error('STICKER_API_KEY/GLM_API_KEY is not configured');
  }
}

function ensureDirectory() {
  if (!fs.existsSync(STICKER_OUTPUT_DIR)) {
    fs.mkdirSync(STICKER_OUTPUT_DIR, { recursive: true });
  }
}

function sanitizeText(value = '') {
  return value.replace(/[&<>"]/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return map[char] || char;
  });
}

function buildStickerPrompt(keyword = '') {
  return `你是一位擅长设计二次元风格表情包的创意总监。
根据下方关键词，设计一个适合在聊天软件中发送的「超可爱表情包」，并输出严格的 JSON：

关键词: ${keyword || '可爱 开心 氛围'}

JSON schema:
{
  "primaryEmoji": "😄",
  "tagline": "四个字以内的短语",
  "palette": ["#FFAFBD", "#ffc3a0"],
  "style": "赛博/手绘/像素/涂鸦之一",
  "mood": "描述整体氛围"
}

注意：
- palette 需返回 2~3 个 HEX 颜色值
- tagline 务必简短有趣
- primaryEmoji 请选择与主题最贴切的 emoji`;
}

function buildFallbackPlan(keyword = '') {
  return {
    primaryEmoji: '😄',
    tagline: keyword ? keyword.slice(0, 6) : '快乐出击',
    palette: ['#FFAFBD', '#ffc3a0'],
    style: 'cyber',
    mood: 'vivid',
    prompt: keyword || '可爱 开心 氛围'
  };
}

async function callStickerModel(modelId, promptText) {
  const body = {
    model: modelId,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '你是视觉设计助手，负责提炼关键词并输出表情包设计 JSON。'
      },
      {
        role: 'user',
        content: buildStickerPrompt(promptText)
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  };

  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STICKER_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sticker plan API failed: ${text}`);
  }

  const data = await response.json();
  let parsedPlan = null;
  try {
    parsedPlan = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
  } catch (err) {
    parsedPlan = null;
  }

  return {
    primaryEmoji: parsedPlan?.primaryEmoji || '😆',
    tagline: parsedPlan?.tagline || '快乐出击',
    palette: Array.isArray(parsedPlan?.palette) && parsedPlan.palette.length
      ? parsedPlan.palette.slice(0, 3)
      : ['#FFAFBD', '#ffc3a0'],
    style: parsedPlan?.style || 'cyber',
    mood: parsedPlan?.mood || 'vivid',
    prompt: promptText
  };
}

async function requestStickerPlan(promptText = '') {
  ensureApiKey();
  const tried = [];
  const models = [STICKER_PLAN_MODEL_ID, STICKER_FALLBACK_MODEL_ID].filter(Boolean);

  for (const modelId of models) {
    try {
      const plan = await callStickerModel(modelId, promptText);
      return { plan, modelId };
    } catch (err) {
      const msg = err?.message || err.toString();
      tried.push(`[${modelId}] ${msg}`);
      console.error(`[Sticker] model ${modelId} failed:`, msg);
    }
  }

  throw new Error(tried.join(' | '));
}

function buildImagePrompt(plan, keyword = '') {
  const palette = (Array.isArray(plan.palette) ? plan.palette : []).filter(Boolean).join(', ');
  const basePrompt = keyword || plan.prompt || '可爱 开心 氛围';
  const tagline = plan.tagline ? `在画面中加入中文短语「${plan.tagline}」` : '';
  const style = plan.style ? `风格: ${plan.style}` : '';
  const mood = plan.mood ? `氛围: ${plan.mood}` : '';
  const emojiMood = plan.primaryEmoji ? `参考 emoji ${plan.primaryEmoji} 的情绪表达` : '';

  return `
设计一个高分辨率的聊天表情贴纸，画面需要可爱、夸张且讨喜。
关键词: ${basePrompt}
${style}
${mood}
${emojiMood}
配色建议: ${palette || '柔和的霓虹色调'}
${tagline}
请使用透明背景，强调二次元手绘贴纸风格。`.trim();
}

function guessExtension(mimeType = '') {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  return map[mimeType.toLowerCase()] || '.png';
}

async function fetchBufferFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sticker image URL fetch failed: ${response.status} ${text}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 直接走与 testGen/stickerGen.js 类似的简单生成（无规划阶段）
async function callSimpleImage(promptText = '') {
  ensureApiKey();

  const endpoint = STICKER_IMAGE_ENDPOINT || `${RAW_IMAGE_BASE_URL}/images/generations`;
  const body = {
    model: STICKER_IMAGE_MODEL_ID || 'Kwai-Kolors/Kolors',
    prompt: promptText || 'cute sticker, bright cartoon style, transparent background',
    image_size: STICKER_IMAGE_SIZE || '768x768',
    batch_size: 1,
    num_inference_steps: Number.isFinite(STICKER_IMAGE_STEPS) ? STICKER_IMAGE_STEPS : 20,
    guidance_scale: Number.isFinite(STICKER_IMAGE_CFG) ? STICKER_IMAGE_CFG : 7.5
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STICKER_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sticker simple image API failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const url = data?.data?.[0]?.url;
  if (!url) {
    throw new Error(`Sticker simple image API missing url: ${JSON.stringify(data).slice(0, 400)}`);
  }

  const buffer = await fetchBufferFromUrl(url);
  return {
    buffer,
    mimeType: 'image/png',
    modelId: STICKER_IMAGE_MODEL_ID,
    source: 'simple-direct',
    url
  };
}

async function callStickerImage(plan, keyword = '') {
  ensureApiKey();

  const prompt = buildImagePrompt(plan, keyword);
  const sourceTag = isOpenAIStyleImageApi ? 'kolors' : 'wanx-t2i';

  const buildWanxPayload = () => {
    const inputPayload = {
      prompt,
      image_num: STICKER_IMAGE_BATCH,
      response_format: STICKER_IMAGE_RESPONSE_FORMAT
    };
    if (STICKER_IMAGE_SIZE) {
      inputPayload.size = STICKER_IMAGE_SIZE;
    }
    if (STICKER_IMAGE_NEG_PROMPT) {
      inputPayload.negative_prompt = STICKER_IMAGE_NEG_PROMPT;
    }
    if (Number.isFinite(STICKER_IMAGE_CFG)) {
      inputPayload.cfg_scale = STICKER_IMAGE_CFG;
    }
    if (Number.isFinite(STICKER_IMAGE_STEPS)) {
      inputPayload.steps = STICKER_IMAGE_STEPS;
    }

    return {
      model: STICKER_IMAGE_MODEL_ID,
      n: STICKER_IMAGE_BATCH,
      input: inputPayload
    };
  };

  const buildOpenAIPayload = () => {
    const payload = {
      model: STICKER_IMAGE_MODEL_ID,
      prompt,
      n: STICKER_IMAGE_BATCH,
      response_format: STICKER_IMAGE_RESPONSE_FORMAT
    };
    if (STICKER_IMAGE_SIZE) {
      payload.size = STICKER_IMAGE_SIZE;
    }
    if (STICKER_IMAGE_NEG_PROMPT) {
      payload.negative_prompt = STICKER_IMAGE_NEG_PROMPT;
    }
    if (Number.isFinite(STICKER_IMAGE_CFG)) {
      payload.cfg_scale = STICKER_IMAGE_CFG;
    }
    if (Number.isFinite(STICKER_IMAGE_STEPS)) {
      payload.steps = STICKER_IMAGE_STEPS;
    }
    return payload;
  };

  const body = isOpenAIStyleImageApi ? buildOpenAIPayload() : buildWanxPayload();

  const response = await fetch(IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STICKER_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sticker image API failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const candidateLists = [data?.data, data?.output, data?.images, data?.result, data?.results];
  let payloadList = null;
  for (const candidate of candidateLists) {
    if (Array.isArray(candidate) && candidate.length) {
      payloadList = candidate;
      break;
    }
    if (candidate && typeof candidate === 'object') {
      payloadList = [candidate];
      break;
    }
  }
  if (!payloadList || !payloadList.length) {
    console.warn('[Sticker] image API returned unexpected shape:', JSON.stringify(data).slice(0, 500));
    throw new Error('Sticker image API returned empty payload');
  }

  const payload = payloadList[0];
  const base64 =
    payload?.b64_json ||
    payload?.image_base64 ||
    payload?.base64 ||
    payload?.base64_data ||
    payload?.b64;

  if (base64) {
    const mimeType = payload?.mime_type || payload?.content_type || 'image/png';
    return {
      buffer: Buffer.from(base64, 'base64'),
      mimeType,
      modelId: data?.model || STICKER_IMAGE_MODEL_ID,
      source: sourceTag
    };
  }

  if (payload?.url) {
    const mimeType = payload?.mime_type || payload?.content_type || 'image/png';
    const buffer = await fetchBufferFromUrl(payload.url);
    return {
      buffer,
      mimeType,
      modelId: data?.model || STICKER_IMAGE_MODEL_ID,
      source: sourceTag
    };
  }

  throw new Error('Sticker image API payload missing base64/url data');
}

function buildStickerSvg(plan) {
  const gradientId = `grad-${Date.now()}`;
  const [colorA, colorB, colorC] = [
    plan.palette?.[0] || '#FFAFBD',
    plan.palette?.[1] || '#ffc3a0',
    plan.palette?.[2] || plan.palette?.[0] || '#FFAFBD'
  ];

  const emoji = sanitizeText(plan.primaryEmoji || '😄');
  const tagline = sanitizeText(plan.tagline || '开心每一天');
  const mood = sanitizeText(plan.mood || 'vivid');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="70%" stop-color="${colorB}"/>
      <stop offset="100%" stop-color="${colorC}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="rgba(0,0,0,0.35)" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#${gradientId})"/>
  <g filter="url(#shadow)">
    <circle cx="256" cy="230" r="140" fill="rgba(255,255,255,0.15)"/>
  </g>
  <text x="50%" y="250" text-anchor="middle" font-size="150" dominant-baseline="middle">${emoji}</text>
  <text x="50%" y="360" text-anchor="middle" font-size="42" font-family="\"PingFang SC\", \"Microsoft YaHei\", sans-serif" fill="#ffffff" font-weight="700">
    ${tagline}
  </text>
  <text x="50%" y="410" text-anchor="middle" font-size="20" font-family="\"JetBrains Mono\", monospace" fill="rgba(255,255,255,0.75)">
    ${mood.toUpperCase()}
  </text>
</svg>`;
}

function persistStickerContent(content, extension = '.svg', encoding = 'utf8') {
  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  const filename = `sticker-${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
  const filepath = path.join(STICKER_OUTPUT_DIR, filename);

  if (Buffer.isBuffer(content)) {
    fs.writeFileSync(filepath, content);
  } else {
    fs.writeFileSync(filepath, content, encoding);
  }

  return {
    url: `/stickers/${filename}`,
    filepath
  };
}

export async function generateStickerAsset(promptText = '', user = null) {
  ensureDirectory();

  // 简单模式：完全复用 testGen/stickerGen.js 的直连生成
  if (STICKER_SIMPLE_MODE) {
    try {
      const imageResult = await callSimpleImage(promptText);
      const { url } = persistStickerContent(
        imageResult.buffer,
        guessExtension(imageResult.mimeType),
      );

      return {
        url,
        meta: {
          tagline: promptText.slice(0, 20) || 'AI Sticker',
          modelId: imageResult.modelId || STICKER_IMAGE_MODEL_ID,
          mimeType: imageResult.mimeType || 'image/png',
          source: imageResult.source || 'simple-direct',
          originUrl: imageResult.url
        }
      };
    } catch (simpleError) {
      console.error('[Sticker] simple image generation failed, fallback to plan flow:', simpleError);
      // 继续走下方 plan+image 逻辑作为兜底
    }
  }

  let planResult;
  try {
    planResult = await requestStickerPlan(promptText);
  } catch (error) {
    console.error('[Sticker] plan generation failed:', error);
    planResult = { plan: buildFallbackPlan(promptText), modelId: STICKER_FALLBACK_MODEL_ID };
  }

  const plan = planResult.plan || buildFallbackPlan(promptText);

  try {
    const imageResult = await callStickerImage(plan, promptText);
    const { url } = persistStickerContent(
      imageResult.buffer,
      guessExtension(imageResult.mimeType),
    );

    return {
      url,
      meta: {
        ...plan,
        modelId: imageResult.modelId || STICKER_IMAGE_MODEL_ID,
        mimeType: imageResult.mimeType || 'image/png',
        source: imageResult.source || 'wanx-t2i'
      }
    };
  } catch (imageError) {
    console.error('[Sticker] image generation failed, fallback to SVG:', imageError);
    const svg = buildStickerSvg(plan);
    const { url } = persistStickerContent(svg, '.svg', 'utf8');

    return {
      url,
      meta: {
        ...plan,
        modelId: planResult.modelId || STICKER_FALLBACK_MODEL_ID,
        source: 'svg-fallback',
        error: imageError.message
      }
    };
  }
}

