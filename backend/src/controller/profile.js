import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import mongoose from 'mongoose';

// 获取用户个人主页数据
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    // 获取当前登录用户（如果有）
    let currentUser = null;
    if (token) {
      currentUser = await User.findOne({ username: token });
      console.log('Token:', token, '找到的用户:', currentUser?.username);
    } else {
      console.log('未提供token');
    }
    
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

    // 我的模因币 - 将用户创作的模因作为模因币返回（每个模因代表一个模因币）
    const myCoins = (user.workList || []).map(meme => {
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

    // 判断是否是查看自己的主页
    // 比较当前登录用户的ID和目标用户的ID
    const isOwnProfile = currentUser && currentUser._id.toString() === user._id.toString();
    
    // 调试日志
    console.log('获取个人主页 - Token:', token);
    console.log('获取个人主页 - 当前用户:', currentUser?.username, '当前用户ID:', currentUser?._id);
    console.log('获取个人主页 - 目标用户:', user.username, '目标用户ID:', user._id);
    console.log('获取个人主页 - 是否自己的主页:', isOwnProfile);
    
    // 查询关注该用户的用户列表（粉丝）
    // 粉丝数应该总是查询并返回，但粉丝列表只在查看自己主页时返回
    const followersCount = await User.countDocuments({ following: user._id });
    console.log('粉丝总数:', followersCount);
    
    // 只有查看自己的主页时才返回粉丝列表详情
    let followers = [];
    if (isOwnProfile) {
      console.log('是自己的主页，开始查询粉丝列表...');
      const followersList = await User.find({ following: user._id })
        .select('_id username nickname avatar')
        .limit(100); // 限制最多返回100个粉丝

      // 格式化粉丝数据
      followers = followersList.map(follower => {
        const idStr = follower._id.toString();
        
        // 优先使用用户设置的头像，如果没有则生成默认头像
        let followerAvatar = follower.avatar;
        if (!followerAvatar || followerAvatar.trim() === '') {
          // 使用ID的hash值生成1-70之间的数字
          let hash = 0;
          for (let i = 0; i < idStr.length; i++) {
            hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
          }
          const imgNum = Math.abs(hash % 70) + 1;
          followerAvatar = `https://i.pravatar.cc/150?img=${imgNum}`;
        }
        
        return {
          id: idStr,
          username: `@${follower.username}`,
          nickname: follower.nickname || `用户${follower._id}`,
          avatar: followerAvatar,
        };
      });
      console.log('查询到的粉丝列表:', followers.length, '个粉丝');
    } else {
      console.log('不是自己的主页，不返回粉丝列表详情');
    }

    // 查询该用户关注的用户列表
    const followingList = await User.findById(user._id)
      .select('following')
      .populate('following', 'username nickname avatar _id');

    // 格式化关注数据
    const following = (followingList?.following || []).map(followedUser => {
      const idStr = followedUser._id.toString();
      
      // 优先使用用户设置的头像，如果没有则生成默认头像
      let followedAvatar = followedUser.avatar;
      if (!followedAvatar || followedAvatar.trim() === '') {
        // 使用ID的hash值生成1-70之间的数字
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) {
          hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
          hash = hash & hash; // Convert to 32bit integer
        }
        const imgNum = Math.abs(hash % 70) + 1;
        followedAvatar = `https://i.pravatar.cc/150?img=${imgNum}`;
      }
      
      return {
        id: idStr,
        username: `@${followedUser.username}`,
        nickname: followedUser.nickname || `用户${followedUser._id}`,
        avatar: followedAvatar,
      };
    });

    // 生成默认头像（如果用户没有设置头像）
    let userAvatar = user.avatar;
    if (!userAvatar || userAvatar.trim() === '') {
      // 使用ID的hash值生成1-70之间的数字
      const idStr = user._id.toString();
      let hash = 0;
      for (let i = 0; i < idStr.length; i++) {
        hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
        hash = hash & hash;
      }
      const imgNum = Math.abs(hash % 70) + 1;
      userAvatar = `https://i.pravatar.cc/150?img=${imgNum}`;
    }

    // 构建返回数据
    const userData = {
      id: user._id.toString(),
      avatar: userAvatar, // 使用用户设置的头像或默认头像
      nickname: user.nickname || `用户${user._id}`,
      username: `@${user.username}`,
      bio: user.bio || `这是用户 ${user.username} 的个人简介。`, // 使用实际的bio字段，如果没有则使用默认值
      followers: followersCount, // 使用查询到的粉丝总数
      following: following.length,
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

// 关注/取消关注用户
export const followUser = async (req, res) => {
  try {
    const { username: targetUsername } = req.params; // 要关注的目标用户名
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 1003, message: '未提供认证令牌' });
    }

    // 获取当前登录用户（临时使用username作为token）
    let currentUser = await User.findOne({ username: token });
    
    if (!currentUser) {
      return res.status(401).json({ code: 1002, message: '用户不存在或令牌无效' });
    }

    // 获取目标用户
    let targetUser = await User.findOne({ username: targetUsername });
    
    if (!targetUser) {
      // 尝试作为用户ID查询
      try {
        if (mongoose.Types.ObjectId.isValid(targetUsername)) {
          targetUser = await User.findById(targetUsername);
        }
      } catch (idError) {
        // ID格式无效，忽略错误
      }
    }

    if (!targetUser) {
      return res.status(404).json({ code: 1002, message: '目标用户不存在' });
    }

    // 不能关注自己
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ code: 1008, message: '不能关注自己' });
    }

    // 检查是否已关注
    const isFollowing = currentUser.following.some(
      id => id.toString() === targetUser._id.toString()
    );

    if (isFollowing) {
      // 取消关注
      currentUser.following.pull(targetUser._id);
      await currentUser.save();
      
      res.status(200).json({
        code: 0,
        message: `已取消关注用户 ${targetUsername}`,
        isFollowing: false,
        targetUser: {
          _id: targetUser._id,
          username: targetUser.username,
          nickname: targetUser.nickname,
        }
      });
    } else {
      // 关注
      currentUser.following.push(targetUser._id);
      await currentUser.save();
      
      res.status(200).json({
        code: 0,
        message: `已关注用户 ${targetUsername}`,
        isFollowing: true,
        targetUser: {
          _id: targetUser._id,
          username: targetUser.username,
          nickname: targetUser.nickname,
        }
      });
    }
  } catch (error) {
    console.error('关注/取消关注用户失败:', error);
    res.status(500).json({
      code: 5000,
      message: '关注/取消关注用户失败',
      error: {
        name: error.name,
        message: error.message,
      }
    });
  }
};

