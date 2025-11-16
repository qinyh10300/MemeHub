import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';

// 获取用户个人主页数据
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // 支持通过用户名或用户ID查询
    let user;
    // 先尝试作为用户名查询
    user = await User.findOne({ username })
      .populate('workList', 'title ticker imageUrl description likes _id')
      .populate('favoriteList', 'title ticker imageUrl description likes _id');
    
    // 如果用户名查询失败，尝试作为用户ID查询
    if (!user) {
      try {
        user = await User.findById(username)
          .populate('workList', 'title ticker imageUrl description likes _id')
          .populate('favoriteList', 'title ticker imageUrl description likes _id');
      } catch (idError) {
        // ID格式无效，忽略错误
      }
    }
    
    if (!user) {
      return res.status(404).json({ 
        code: 1002, 
        message: '用户不存在' 
      });
    }

    // 计算用户所有模因的总点赞数
    const userMemes = await Meme.find({ author: user._id });
    const totalLikes = userMemes.reduce((sum, meme) => sum + (meme.likes || 0), 0);

    // 获取服务器基础URL（用于构建完整的图片URL）
    const baseUrl = req.protocol + '://' + req.get('host');
    
    // 格式化我创作的模因数据
    const myMemes = (user.workList || []).map(meme => {
      let imageUrl = meme.imageUrl || `https://i.pravatar.cc/150?img=${meme._id}`;
      // 如果是相对路径，转换为完整URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }
      return {
        image: imageUrl,
        name: meme.title || '未命名模因',
        code: meme.ticker || '',
        description: meme.description || '作者很懒，没有填写简介',
        id: meme._id.toString(),
      };
    });

    // 格式化我的收藏数据
    const myFavorites = (user.favoriteList || []).map(meme => {
      let imageUrl = meme.imageUrl || `https://i.pravatar.cc/150?img=${meme._id}`;
      // 如果是相对路径，转换为完整URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }
      return {
        image: imageUrl,
        name: meme.title || '未命名模因',
        code: meme.ticker || '',
        description: meme.description || '作者很懒，没有填写简介',
        id: meme._id.toString(),
      };
    });

    // 我的模因币 - 暂时返回空数组，后续可以根据coins字段扩展
    const myCoins = [];

    // 粉丝列表 - 暂时返回空数组，因为User模型中没有followers字段
    // TODO: 如果后续添加了关注功能，需要查询关注该用户的用户列表
    const followers = [];

    // 构建返回数据
    const userData = {
      id: user._id.toString(),
      avatar: `https://i.pravatar.cc/150?img=${user._id}`, // 根据用户 ID 动态生成头像
      nickname: user.nickname || `用户${user._id}`,
      username: `@${user.username}`,
      bio: `这是用户 ${user.username} 的个人简介。`, // TODO: 如果User模型添加了bio字段，使用实际值
      followers: followers.length, // 暂时返回0，后续添加关注功能后更新
      following: 0, // 暂时返回0，后续添加关注功能后更新
      likes: totalLikes,
      memesData: {
        '我创作的模因': myMemes,
        '我的模因币': myCoins,
        '我的收藏': myFavorites,
        '粉丝': followers,
      }
    };

    res.status(200).json({
      code: 0,
      message: '获取用户信息成功',
      data: userData
    });
  } catch (error) {
    console.error('获取用户个人主页失败:', error);
    res.status(500).json({
      code: 5000,
      message: '获取用户个人主页失败',
      error: {
        name: error.name,
        message: error.message,
      }
    });
  }
};

