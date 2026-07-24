import fs from 'fs';
import path from 'path';

// ====== 配置区 ======
const API_KEY = process.env.STICKER_API_KEY;
const OUTPUT_DIR = 'testGen/outputs';
const OUTPUT_NAME = 'result.png';

// SiliconFlow API
const API_URL = 'https://api.siliconflow.cn/v1/images/generations';

// ====== 主函数 ======
async function generateAndSaveImage() {
  if (!API_KEY) {
    throw new Error('请先设置 STICKER_API_KEY 环境变量');
  }

  // 1. 调用生成 API
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Kwai-Kolors/Kolors',
      prompt: 'cute sticker of a shiba inu wearing sunglasses and holding bubble tea',
      image_size: '1024x1024',
      batch_size: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5
      // 如果是“编辑图像”，加上：
      // image: 'https://example.com/input.jpg'
    })
  });

  const result = await res.json();

  if (!result.data || !result.data[0]?.url) {
    throw new Error('生成失败，返回结果异常：' + JSON.stringify(result));
  }

  const imageUrl = result.data[0].url;
  console.log('✅ 图片生成成功:', imageUrl);

  // 2. 下载图片
  const imageRes = await fetch(imageUrl);
  const arrayBuffer = await imageRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. 保存到本地
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const outputPath = path.join(OUTPUT_DIR, OUTPUT_NAME);
  fs.writeFileSync(outputPath, buffer);

  console.log('📁 图片已保存到:', outputPath);
}

// ====== 执行 ======
generateAndSaveImage().catch(err => {
  console.error('❌ 出错了:', err);
});
