<template>
  <div class="comment-section">
    <h3>评论</h3>

    <!-- 评论列表 -->
    <div v-if="comments.length" class="comment-list">
      <div v-for="(c, i) in comments" :key="c.id" class="comment-item">
        <img
          :src="c.avatar"
          alt="头像"
          class="comment-avatar"
          @click="goToProfile(c.userId)" 
        />
        <div class="comment-content">
          <p class="comment-author">
            <span
              class="nickname"
              @click="goToProfile(c.userId)"
            >
              {{ c.nickname }}
            </span>
            <span class="username" @click="startReply(c)">@{{ c.username }}</span>
          </p>
          <p class="comment-text">
            <template v-if="c.replyTo">
              回复 <span class="reply-to">@{{ getReplyUsername(c.replyTo) }}  </span>：
            </template>
            {{ c.content }}
          </p>
          <div class="comment-meta">
            <span class="comment-time">{{ c.time }}</span>
            <button class="like-button" @click="toggleLike(c)">
              ❤ <span>{{ c.likes }}</span>
            </button>
            <button class="reply-button" @click="startReply(c)">
              回复
            </button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="no-comment">暂无评论</p>

    <!-- 回复提示区域 -->
    <div v-if="replyTarget" class="reply-banner">
      回复 @{{ replyTarget.username }}
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  comments: Array,
});

const emit = defineEmits(['submit-comment']);

const newComment = ref('');
const replyTarget = ref(null);  // ⭐ 当前回复对象
const router = useRouter();

const getReplyUsername = (replyToId) => {
  const replyComment = props.comments.find((c) => c.id === replyToId);
  return replyComment ? replyComment.username : '未知用户';
};

const toggleLike = (comment) => {
  if (comment.isLiked) {
    comment.likes -= 1;
    comment.isLiked = false;
  } else {
    comment.likes += 1;
    comment.isLiked = true;
  }
};

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

// ⭐ 新增：开始回复某个用户
const startReply = (comment) => {
  replyTarget.value = {
    id: comment.id,
    username: comment.username,
  };
};

// ⭐ 新增：取消回复
const cancelReply = () => {
  replyTarget.value = null;
};

// ⭐ 修改：提交评论时带上 replyTo
const handleSubmit = () => {
  const content = newComment.value.trim();
  if (!content) return;

  const newCommentData = {
    avatar: 'https://i.pravatar.cc/50?img=4',
    username: 'current_user',
    nickname: '当前用户',
    content,
    time: '刚刚',
    likes: 0,
    isLiked: false,
    replyTo: replyTarget.value ? replyTarget.value.id : null,
    id: Date.now(),
  };

  // emit('submit-comment', newCommentData);

  newComment.value = '';
  replyTarget.value = null; // 提交后自动取消回复
};
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
}

.reply-to {
  color: #5c9fc8;
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

.reply-button:hover {
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
</style>