import fs from 'fs';
import path from 'path';

// ====== 配置区 ======
const OUTPUT_DIR = 'memesGen';
const OUTPUT_NAME = 'result.png';

// SiliconFlow API
const API_URL = 'https://api.siliconflow.cn/v1/images/generations';

// ====== 图像生成 API 接口 ======
export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.STICKER_API_KEY;

    // 确保提供了prompt
    if (!prompt || prompt.length === 0) {
      return res.status(400).json({ message: '请输入生成图像的描述（prompt）' });
    }

    if (!apiKey) {
      return res.status(503).json({ message: '未配置 STICKER_API_KEY' });
    }

    // 调用生成 API
    const apiRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',  // 使用的模型，可以根据需要更改
        prompt: prompt,
        image_size: '1024x1024',
        batch_size: 1,
        num_inference_steps: 20,
        guidance_scale: 7.5
      })
    });

    const result = await apiRes.json();

    if (!result.data || !result.data[0]?.url) {
      throw new Error('生成失败，返回结果异常：' + JSON.stringify(result));
    }

    const imageUrl = result.data[0].url;
    console.log('✅ 图片生成成功:', imageUrl);

    // 下载生成的图片
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 保存到本地
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    const outputPath = path.join(OUTPUT_DIR, OUTPUT_NAME);
    fs.writeFileSync(outputPath, buffer);

    console.log('📁 图片已保存到:', outputPath);

    // 返回图像 URL 和保存路径
    res.status(200).json({
      message: '图像生成成功',
      imageUrl: imageUrl,
      savedPath: outputPath
    });

  } catch (error) {
    res.status(500).json({
      message: '生成图像失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};
