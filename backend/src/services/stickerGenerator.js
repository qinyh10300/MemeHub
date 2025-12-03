import fs from 'fs';
import path from 'path';
import * as Const from '../configs/const.js';

const BASE_URL = process.env.GLM_BASE_URL || 'https://llmapi.paratera.com';
const STICKER_MODEL_ID = process.env.STICKER_MODEL_ID || 'WanX2.1-T2I-Plus';
const STICKER_FALLBACK_MODEL_ID = process.env.STICKER_FALLBACK_MODEL_ID || process.env.GLM_MODEL_ID || 'DeepSeek-V3.1';
const CHAT_PATH = '/chat/completions';
const API_ENDPOINT = `${BASE_URL.replace(/\/$/, '')}${CHAT_PATH}`;
const STICKER_OUTPUT_DIR = path.join(process.cwd(), Const.STICKER_DIR);

function ensureApiKey() {
  if (!process.env.GLM_API_KEY) {
    throw new Error('GLM_API_KEY is not configured');
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

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GLM_API_KEY}`
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
  const models = [STICKER_MODEL_ID, STICKER_FALLBACK_MODEL_ID].filter(Boolean);

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

export async function generateStickerAsset(promptText = '', user = null) {
  ensureDirectory();
  const { plan, modelId } = await requestStickerPlan(promptText);
  const svg = buildStickerSvg(plan);
  const filename = `sticker-${Date.now()}-${Math.random().toString(16).slice(2)}.svg`;
  const filepath = path.join(STICKER_OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, svg, 'utf8');

  return {
    url: `/stickers/${filename}`,
    meta: { ...plan, modelId }
  };
}

