<template>
  <div class="comment-section">
    <!-- <h3>评论</h3> -->
    <h3 class="comment-title">
      评论
      <div class="sort-toggle">
        <span :class="{ active: sortMode === 'time' }" @click="setSort('time')">时间</span>
        <span :class="{ active: sortMode === 'hot' }" @click="setSort('hot')">热度</span>
        <div class="slider" :class="sortMode"></div>
      </div>
    </h3>

    <!-- 评论列表 -->
    <div v-if="comments.length" class="comment-list" ref="commentListRef">
      <div v-for="(c, i) in comments" :key="c.id" class="comment-item" :ref="el => commentRefs[c._id] = el">
        <img
          :src="c.user.avatar"
          alt="头像"
          class="comment-avatar"
          @click="goToProfile(c.user.username)" 
        />
        <div class="comment-content">
          <p class="comment-author">
            <span
              class="nickname"
              @click="goToProfile(c.user.username)"
            >
              {{ c.user.nickname }}
            </span>
            <span class="username" @click="goToProfile(c.user.username)">@{{ c.user.username }}</span>
          </p>
          <p class="comment-text">
            <template v-if="c.reference">
              <template v-if="replyComment = getReplyComment(c.reference)">
                回复
                <!-- 如果不是未知用户 → 可点击 -->
                <span
                  v-if="replyComment.user.username !== '未知用户'"
                  class="reply-to"
                  @click="goToProfile(getReplyComment(c.reference).user.username)"
                >
                  @{{ replyComment.user.username }}
                </span>

                <!-- 如果是未知用户 → 不可点击 -->
                <span
                  v-else
                  class="reply-to"
                >
                  @{{ replyComment.user.username }}
                </span>
                ：
              </template>
            </template>
            {{ c.content }}
          </p>

          <!-- 显示引用的评论内容 -->
          <p v-if="c.reference && replyComment.content" class="reply-content" @click="scrollToComment(c.reference)">
            {{ replyComment.content.length > 15 ? replyComment.content.slice(0, 15) + '...' : replyComment.content }}
          </p>
          <div class="comment-meta">
            <span class="comment-time">{{ new Date(c.createdAt).toLocaleString() }}</span>
            <button
              class="like-button"
              :class="{ liked: c.userinfo.is_liked }"
              @click="toggleLike(c)"
            >
              ❤ <span>{{ c.likes }}</span>
            </button>
            <button class="reply-button" @click="startReply(c)">
              回复
            </button>
            <button 
              v-if="c.userinfo.is_author" 
              class="delete-button" 
              @click="deleteComment(c)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="no-comment">暂无评论</p>

    <!-- 回复提示区域 -->
    <div v-if="replyTarget" class="reply-banner">
      回复 @{{ replyTarget.username }} : {{ truncatedContent }}
      <button class="cancel-reply" @click="cancelReply">取消</button>
    </div>

    <!-- 输入框 -->
    <div class="comment-input">
      <textarea v-model="newComment" placeholder="写下你的评论..."></textarea>
      <button @click="handleSubmit">发表</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { emitTaskProgress } from '@/utils/gamificationEvents';

// 接收父组件传入的 meme_id
const props = defineProps({
  meme_id: String,
});

const comments = reactive([]); // 初始化为空数组
const newComment = ref('');
const loading = ref(true); // 加载状态
const error = ref(null); // 错误信息

const replyTarget = ref(null);
const router = useRouter();

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

const commentListRef = ref(null); // 定义 ref

// 默认按时间排序
const sortMode = ref('time');

const setSort = (mode) => {
  if (sortMode.value !== mode) {
    sortMode.value = mode;     // 更新 UI
    fetchComments();           // 重新加载
  }
};

// 获取引用评论的用户名
const getReplyComment = (reference) => {
  // console.log("reference: ", reference);
  const replyComment = comments.find((c) => c._id === reference);
  // console.log("replyComment: ", replyComment || { user: {username: '未知用户'}, content: '' });
  // return replyComment || { user: {username: '未知用户'}, content: '' }; // 如果找不到引用的评论，返回默认值
  return replyComment || { user: {username: '未知用户'}, content: '' };
};

const commentRefs = reactive({});
const scrollToComment = async (id) => {
  await nextTick(); // 确保 DOM 已更新

  const el = commentRefs[id];
  if (el && commentListRef.value) {
    // 让该评论滚动到可视区域
    el.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
};

// 点赞 / 取消点赞
const toggleLike = async (comment) => {
  const oldLiked = comment.userinfo.is_liked;
  const oldLikes = comment.likes;

  // 乐观更新
  comment.userinfo.is_liked = !comment.userinfo.is_liked;
  comment.likes += comment.userinfo.is_liked ? 1 : -1;

  try {
    const response = await fetch(`${server_ip}/api/comment/${comment._id}/like`, {
      method: 'POST',
      headers: {
        'token': user_token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // 撤回
      comment.userinfo.is_liked = oldLiked;
      comment.likes = oldLikes;
      alert(data.message || '点赞失败');
      return;
    }

  } catch (err) {
    console.error('点赞失败:', err);
    comment.userinfo.is_liked = oldLiked;
    comment.likes = oldLikes;
    alert('网络错误，稍后重试');
  }
  // console.log("comment.is_liked: ", comment.is_liked)
  // console.log("comment.likes: ", comment.likes)
};

// 跳转到用户个人主页
const goToProfile = (userId) => {
  console.log("userId: ", userId)
  router.push(`/profile/${userId}`);
};

// 开始回复某个用户
const startReply = (comment) => {
  replyTarget.value = {
    id: comment._id,
    username: comment.user.username,
    content: comment.content,
  };
};

// TODO: 删除评论
const deleteComment = async (comment) => {
  if (!confirm("确定要删除这条评论吗？")) return;

  try {
    const response = await fetch(`${server_ip}/api/comment/${comment._id}`, {
      method: 'DELETE',
      headers: {
        'token': user_token
      },
    });

    const data = await response.json();

    if (response.ok) {
      // 删除成功 → 重新加载评论
      await fetchComments();
    } else {
      console.error("删除失败：", data.message);
      alert(`删除失败：${data.message}`);
    }
  } catch (err) {
    console.error("删除评论时发生错误:", err);
    alert("网络错误，请稍后再试");
  }
};

// 取消回复
const cancelReply = () => {
  replyTarget.value = null;
};

// 限制显示长度
const truncatedContent = computed(() => {
  if (!replyTarget.value || !replyTarget.value.content) return '';
  const maxLength = 15; // 设置最大长度
  return replyTarget.value.content.length > maxLength
    ? replyTarget.value.content.slice(0, maxLength) + '...'
    : replyTarget.value.content;
});

// 提交评论
const handleSubmit = async () => {
  const content = newComment.value.trim();
  if (!content) return;

  try {
    // console.log("handleSubmit props.meme_id: ", props.meme_id)
    // console.log("replyTarget.value.id: ", replyTarget.value)
    const response = await fetch(`${server_ip}/api/meme/${props.meme_id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',   // ← 必须加这个
        'token': user_token
      },
      body: JSON.stringify({ // 将对象序列化为 JSON 字符串
        "content": content,
        reference: replyTarget.value?.id || null, // 如果 replyTarget.value.id 不存在，则设置为 null
      }),
    });

    if (response.ok) {
      newComment.value = ''; // 清空输入框
      await fetchComments(); // 提交成功后重新获取评论数据
      emitTaskProgress('daily-comment', 1, { username: authStore.username || 'guest' });

      // 滚动到评论窗口底部
      nextTick(() => {
        if (commentListRef.value) {
          commentListRef.value.scrollTop = commentListRef.value.scrollHeight;
        }
      });
    } else {
      console.error('提交评论失败:', await response.text());
    }
  } catch (err) {
    console.error('提交评论时发生错误:', err);
  }
  replyTarget.value = null;
};

// 获取评论数据
const fetchComments = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 第一次请求：获取评论 ID 列表
    const sortBy = sortMode.value === 'time' ? 'time' : 'hot';
    const sortOrder = sortBy === "time" ? "asc" : "des";

    const memeResponse = await fetch(
      `${server_ip}/api/meme/${props.meme_id}/comments?sortBy=${sortBy}&sortOrder=${sortOrder}`,
      {
        method: 'GET',
        headers: {
          'token': user_token,
        },
      }
    );

    if (!memeResponse.ok) {
      error.value = '获取评论 ID 列表失败';
      return;
    }

    const memeData = await memeResponse.json();
    const commentIds = memeData.comments; // 提取评论 ID 列表
    const ids = commentIds.map(comment => comment._id);

    // 第二次请求：根据评论 ID 列表获取具体评论数据
    const commentResponse = await fetch(`${server_ip}/api/comment/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // 必须指定请求体类型
        'token': user_token,
      },
      body: JSON.stringify({ commentIds: ids }), // 发送评论 ID 列表
    });

    if (!commentResponse.ok) {
      error.value = '获取评论数据失败';
      return;
    }

    const commentData = await commentResponse.json();

    // 为每个评论添加 reference
    // 构建 id => reference 映射表
    const refMap = Object.fromEntries(
      commentIds.map(c => [c._id, c.reference])
    );

    // 给每条评论补上 reference
    commentData.comments.forEach(c => {
      c.reference = refMap[c._id] ?? null;
    });
    
    comments.splice(0, comments.length, ...commentData.comments); // 更新评论数据
    // console.log('评论数据:', commentData.comments);
  } catch (err) {
    error.value = '网络错误，请稍后再试';
    console.error('获取评论时发生错误:', err);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取评论数据
onMounted(fetchComments);

// 监听 meme_id 的变化（如果父组件动态更新 meme_id）
watch(() => props.meme_id, fetchComments);
</script>

<style scoped>
.comment-section {
  background: #222;
  padding: 20px;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comment-list {
  max-height: 500px; /* 你可以自己调高度 */
  overflow-y: auto;
  padding-right: 4px; /* 避免滚动条顶着内容 */
}

.comment-item {
  display: flex;
  gap: 10px;
  background: #1b1b1b;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer; /* 鼠标悬浮时显示手型 */
}

.nickname {
  cursor: pointer; /* 鼠标悬浮时显示手型 */
  color: #59ad7b;
  margin-right: 8px; /* 添加右边距 */
}

.username {
  cursor: pointer; /* 鼠标悬浮时显示手型 */
  color: #5c9fc8;
  font-size: 12px;
}

.comment-content {
  flex: 1;
}

.comment-author {
  font-weight: bold;
}

.comment-text {
  margin-top: 4px;
  word-break: break-word; /* 强制在单词内换行 */
  overflow-wrap: break-word; /* 兼容性更好的换行方式 */
  white-space: normal; /* 确保内容正常换行 */
}

.reply-to {
  color: #5c9fc8;
}

.reply-to:hover {
  font-weight: bold;
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
}

.comment-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #aaa;
}

.like-button {
  background: none;
  border: none;
  color: #888; /* 默认灰色 */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s; /* 添加过渡效果 */
}

.like-button:hover {
  color: #ad270d; /* 鼠标悬停时变为红色 */
}

/* TODO：点赞后显示红色 */
.like-button.liked {
  color: #ff4d4f; /* 更鲜艳的红色 */
}

.reply-button {
  background: none;
  border: none;
  color: #888; /* 默认灰色 */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s; /* 添加过渡效果 */
  margin-top: -2.5px; /* 向下移动一点 */
}

.delete-button {
  background: none;
  border: none;
  color: #888; /* 默认灰色 */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s; /* 添加过渡效果 */
  margin-top: -2.5px; /* 向下移动一点 */
}

.reply-button:hover {
  font-weight: bold; /* 悬停时加粗字体 */
}

.delete-button:hover {
  font-weight: bold; /* 悬停时加粗字体 */
}


.no-comment {
  color: #777;
  margin-bottom: 16px;
}

.comment-input textarea {
  width: 100%;
  height: 80px;
  /* border: none; */
  border-radius: 8px;
  padding: 10px;
  resize: none;
  font-size: 16px;
  background: #1c1c1c;
  color: #eee;
  margin-bottom: 10px;
}

.comment-input button {
  padding: 8px 16px;
  background: #6c47ff;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.reply-banner {
  background: #333;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  color: #ddd;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel-reply {
  background: none;
  border: none;
  color: #c55;
  cursor: pointer;
  font-size: 14px;
}
.cancel-reply:hover {
  font-weight: bold;
}

.reply-content {
  background: #333; /* 灰色背景 */
  color: #aaa; /* 字体颜色 */
  font-size: 13px; /* 字体大小稍小 */
  padding: 2px 5px; /* 内边距 */
  border-radius: 6px; /* 圆角 */
  margin-top: 4px; /* 与主评论的间距 */
  margin-bottom: 4px; /* 与点赞的间距 */
  white-space: nowrap; /* 禁止换行 */
  overflow: hidden; /* 超出隐藏 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}
.reply-content:hover {
  font-weight: bold;
  cursor: pointer; /* 鼠标悬停时显示手型光标 */
  background: #444; /* 鼠标悬停时背景变深 */
}

.comment-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-toggle {
  position: relative;
  width: 120px;
  background: #333;
  border-radius: 20px;
  padding: 4px;
  display: flex;
  justify-content: space-between;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  /* transform: translateX(-10px);  */
  transform: translateY(-2px); 
}

.sort-toggle span {
  flex: 1;
  text-align: center;
  z-index: 2;
}

.sort-toggle span.active {
  color: white;
  font-weight: bold;
}

.sort-toggle .slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 50%;
  background: #6c47ff;
  border-radius: 18px;
  transition: transform 0.3s;
  z-index: 1;
}

.sort-toggle .slider.time {
  transform: translateX(0%);
}

.sort-toggle .slider.hot {
  transform: translateX(90%);
}

</style>