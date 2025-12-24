<template>
<div class="chat-container">
    <div class="chat-layout">
    <!-- 左侧：会话列表 -->
    <aside class="sidebar">
        <div class="sidebar-header">
        <h3>消息</h3>
        </div>
        <div class="conversation-list">
        <div 
            v-for="conv in conversations" 
            :key="conv.user._id"
            class="conversation-item"
            :class="{ active: currentTarget?._id === conv.user._id }"
            @click="selectConversation(conv.user)"
        >
            <div class="avatar-wrapper">
            <img :src="conv.user.avatar" class="avatar" />
            <span v-if="conv.unreadCount > 0" class="unread-dot"></span>
            </div>
            <div class="info">
            <div class="top-row">
                <div class="name">{{ conv.user.nickname || conv.user.username }}</div>
                <div class="time-badge">
                  <div class="time">{{ formatTime(conv.lastMessage.createdAt) }}</div>
                  <span v-if="conv.unreadCount > 0" class="unread-count">
                    {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                  </span>
                </div>
            </div>
            <div class="last-msg">
                <template v-if="!conv.lastMessage.content && !conv.lastMessage.isSelf">
                  对方发送了新消息
                </template>
                <template v-else-if="!conv.lastMessage.content && conv.lastMessage.isSelf">
                  我: （已撤回）
                </template>
                <template v-else>
                  {{ conv.lastMessage.isSelf ? '我: ' : '' }}{{ conv.lastMessage.content }}
                </template>
            </div>
            </div>
        </div>
        <div v-if="conversations.length === 0" class="empty-state">
            暂无消息
        </div>
        </div>
    </aside>

    <!-- 右侧：聊天窗口 -->
    <main class="chat-window">
        <template v-if="currentTarget">
        <div class="chat-header">
            <div class="header-user">
            <img :src="currentTarget.avatar" class="header-avatar" />
            <span class="header-name">{{ currentTarget.nickname || currentTarget.username }}</span>
            </div>
        </div>
        
        <div class="messages-area" ref="messagesContainer">
            <div 
            v-for="msg in messages" 
            :key="msg._id" 
            class="message-row"
            :class="{ 'mine': msg.sender.username === authStore.username }"
            >
            <img v-if="msg.sender.username !== authStore.username" :src="msg.sender.avatar" class="msg-avatar" />
            <div class="bubble-container">
                <div 
                  class="message-bubble" 
                  :class="{ recalled: msg.isDeleted, 'sticker-bubble': msg.type === 'sticker' && !msg.isDeleted }"
                >
                  <template v-if="msg.isDeleted">
                    {{ msg.sender.username === authStore.username ? '你撤回了一条消息' : '对方撤回了一条消息' }}
                  </template>
                  <template v-else-if="msg.type === 'sticker' && msg.stickerUrl">
                    <img
                      class="sticker-image"
                      :src="resolveAssetUrl(msg.stickerUrl)"
                      alt="sticker"
                    />
                    <div v-if="msg.stickerMeta?.tagline" class="sticker-caption">
                      {{ msg.stickerMeta.tagline }}
                    </div>
                  </template>
                  <template v-else>
                    {{ msg.content }}
                  </template>
                </div>
                <div class="bubble-footer">
                  <div class="bubble-meta">
                    <div class="bubble-time">
                      <template v-if="msg.isDeleted && msg.deletedAt">
                        {{ formatTime(msg.deletedAt) }} · 已撤回
                      </template>
                      <template v-else>
                        {{ formatTime(msg.createdAt) }}
                      </template>
                    </div>
                    <span 
                      v-if="msg.sender.username === authStore.username && !msg.isDeleted"
                      class="read-state"
                    >
                      {{ msg.isRead ? '已读' : '未读' }}
                    </span>
                  </div>
                  <button
                    v-if="msg.sender.username === authStore.username && !msg.isDeleted && canRecall(msg)"
                    class="recall-btn"
                    @click.stop="recallMessage(msg)"
                    :disabled="isRecalling(msg._id)"
                  >
                    {{ isRecalling(msg._id) ? '撤回中...' : '撤回' }}
                  </button>
                </div>
            </div>
            </div>
        </div>

        <div class="input-wrapper">
            <div class="input-toolbar">
              <button class="toolbar-btn" @click="toggleEmojiPanel">
                😊
              </button>
              <span class="toolbar-text">表情 / 表情包</span>
            </div>
            <div class="input-area">
            <textarea 
                v-model="inputContent" 
                placeholder="发送消息..." 
                @keydown.enter.prevent="sendMessage"
            ></textarea>
            <button class="send-btn" @click="sendMessage" :disabled="!inputContent.trim()">
                <span class="send-icon">➤</span>
            </button>
            </div>
            <transition name="fade">
              <div v-if="showEmojiPanel" class="emoji-panel">
                <div class="emoji-section">
                  <div class="emoji-tabs">
                    <button 
                      v-for="cat in emojiCategories"
                      :key="cat.id"
                      :class="['emoji-tab', { active: activeEmojiCategory === cat.id }]"
                      @click="setEmojiCategory(cat.id)"
                    >
                      {{ cat.label }}
                    </button>
                  </div>
                  <div class="emoji-grid">
                    <button 
                      v-for="emoji in emojiList"
                      :key="emoji"
                      class="emoji-btn"
                      @click="selectEmoji(emoji)"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                </div>
                <div class="sticker-section">
                  <h4>精选表情包</h4>
                  <div 
                    v-for="pack in stickerPacks" 
                    :key="pack.id" 
                    class="sticker-pack"
                  >
                    <p class="pack-title">{{ pack.title }}</p>
                    <div class="sticker-grid">
                      <button 
                        v-for="item in pack.stickers"
                        :key="item.id"
                        class="sticker-btn"
                        @click="sendStickerMessage({ ...item, source: pack.id })"
                      >
                        <img :src="item.url" :alt="item.label" />
                        <span>{{ item.label }}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="ai-sticker">
                  <div class="ai-header">
                    <h4>AI 生成表情包</h4>
                    <span class="ai-subtitle">使用同款视觉模型，输入灵感词快速生成</span>
                  </div>
                  <div class="ai-form">
                    <input 
                      v-model="stickerPrompt"
                      type="text"
                      placeholder="例如：发薪日、emo熊猫、整点朋克"
                    />
                    <button 
                      class="generate-btn" 
                      :disabled="isGeneratingSticker"
                      @click="handleGenerateSticker"
                    >
                      {{ isGeneratingSticker ? '生成中...' : 'AI 生成' }}
                    </button>
                  </div>
                  <div v-if="generatedStickers.length" class="generated-grid">
                    <button 
                      v-for="item in generatedStickers"
                      :key="item.url"
                      class="sticker-btn generated"
                      @click="sendStickerMessage(item)"
                    >
                      <img :src="item.url" :alt="item.label" />
                      <span>{{ item.label }}</span>
                    </button>
                  </div>
                  <p v-else class="ai-placeholder">生成的表情包会显示在这里</p>
                </div>
              </div>
            </transition>
        </div>
        </template>
        <template v-else>
        <div class="no-chat-selected">
            <div class="placeholder-content">
            <span class="placeholder-icon">💬</span>
            <p>选择一个联系人开始聊天</p>
            </div>
        </div>
        </template>
    </main>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 获取全局刷新提醒方法
const refreshAlerts = inject('refreshAlerts', () => {});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const server_ip = authStore.server_ip ;
const RECALL_WINDOW_MS = 5 * 60 * 1000;

const conversations = ref([]);
const messages = ref([]);
const currentTarget = ref(null);
const inputContent = ref('');
const messagesContainer = ref(null);
const recallingMap = ref({});
const now = ref(Date.now());
let recallTicker = null;
const showEmojiPanel = ref(false);
const emojiCategories = [
  {
    id: 'smile',
    label: '笑脸',
    emojis: ['😀','😁','😂','🤣','😅','😊','😍','😘','😎','🤩','🥳','😇','🤗','😏','😌']
  },
  {
    id: 'gestures',
    label: '手势',
    emojis: ['👍','👎','👏','🙏','👌','🤝','🤘','✌️','🤞','🤟','🙌','💪','🫡','🤙','🖖']
  },
  {
    id: 'animals',
    label: '动物',
    emojis: ['🐶','🐱','🐭','🐻','🐼','🐨','🐸','🐧','🐤','🐙','🦄','🐷','🐯','🐰','🐹']
  },
  {
    id: 'food',
    label: '美食',
    emojis: ['🍎','🍊','🍋','🍉','🍇','🍓','🍒','🥑','🍔','🍟','🍕','🌮','🍣','🍰','🧋']
  }
];
const activeEmojiCategory = ref(emojiCategories[0].id);
const emojiList = computed(() => {
  const current = emojiCategories.find(cat => cat.id === activeEmojiCategory.value);
  return current ? current.emojis : [];
});
const stickerPacks = [
  {
    id: 'classic',
    title: '经典黄豆人',
    stickers: [
      { id: 'joy', label: '大笑', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f602.svg' },
      { id: 'love', label: '比心', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f970.svg' },
      { id: 'cool', label: '酷酷', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f60e.svg' },
      { id: 'sleep', label: '困困', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f634.svg' }
    ]
  },
  {
    id: 'pixel',
    title: '像素可爱风',
    stickers: [
      { id: 'pixel-cat', label: '猫猫', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f640.svg' },
      { id: 'pixel-bear', label: '抱抱', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f43b.svg' },
      { id: 'pixel-fire', label: '冲！', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f525.svg' },
      { id: 'pixel-heart', label: '治愈', url: 'https://twemoji.maxcdn.com/v/latest/svg/1f49c.svg' }
    ]
  }
];
const generatedStickers = ref([]);
const stickerPrompt = ref('');
const isGeneratingSticker = ref(false);

// 获取 Token 的辅助函数
const getToken = () => authStore.token || localStorage.getItem('auth_token') || authStore.username || '';
const resolveAssetUrl = (url = '') => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${server_ip}${normalized}`;
};

// 获取会话列表
const fetchConversations = async () => {
try {
    const res = await fetch(`${server_ip}/api/message/conversations`, {
    headers: { 'token': getToken() }
    });
    const result = await res.json();
    if (result.code === 0) {
    conversations.value = result.data.map(conv => ({
        ...conv,
        unreadCount: conv.unreadCount || 0
    }));
    }
} catch (e) {
    console.error('获取会话失败', e);
}
};

// 获取聊天记录
const clearConversationUnread = (targetId) => {
  const conv = conversations.value.find(c => c.user._id === targetId);
  if (conv) {
    conv.unreadCount = 0;
  }
};

const fetchHistory = async (targetId) => {
try {
    const res = await fetch(`${server_ip}/api/message/history/${targetId}`, {
    headers: { 'token': getToken() }
    });
    const result = await res.json();
    if (result.code === 0) {
    messages.value = result.data;
    clearConversationUnread(targetId);
    await nextTick();
    scrollToBottom();
    // 读取消息后刷新侧边栏提醒
    refreshAlerts();
    }
} catch (e) {
    console.error('获取历史记录失败', e);
}
};

// 发送消息
const sendMessage = async () => {
if (!inputContent.value.trim() || !currentTarget.value) return;

try {
    const res = await fetch(`${server_ip}/api/message/send`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'token': getToken()
    },
    body: JSON.stringify({
        receiverId: currentTarget.value._id,
        content: inputContent.value
    })
    });
    
    if (res.ok) {
    inputContent.value = '';
    showEmojiPanel.value = false;
    await fetchHistory(currentTarget.value._id); // 刷新记录
    await fetchConversations(); // 刷新列表以更新最新消息
    }
} catch (e) {
    console.error('发送失败', e);
}
};

const sendStickerMessage = async (sticker) => {
if (!currentTarget.value) return;
try {
    const res = await fetch(`${server_ip}/api/message/send`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'token': getToken()
    },
    body: JSON.stringify({
        receiverId: currentTarget.value._id,
        type: 'sticker',
        stickerUrl: sticker.rawUrl || sticker.url,
        stickerMeta: sticker.meta || { tagline: sticker.label, source: sticker.source }
    })
    });
    const result = await res.json();
    if (res.ok && result.code === 0) {
    await fetchHistory(currentTarget.value._id);
    await fetchConversations();
    showEmojiPanel.value = false;
    } else {
    alert(result.message || '发送表情包失败');
    }
} catch (e) {
    console.error('发送失败', e);
    alert('发送表情包失败');
}
};

// 选择会话
const selectConversation = (user) => {
currentTarget.value = user;
fetchHistory(user._id);
router.replace(`/chat?target=${user._id}`);
};

const setRecalling = (messageId, value) => {
  recallingMap.value = { ...recallingMap.value, [messageId]: value };
};

const isRecalling = (messageId) => !!recallingMap.value[messageId];

const canRecall = (msg) => {
  if (!msg || msg.isDeleted) return false;
  if (msg.sender.username !== authStore.username) return false;
  const createdAt = new Date(msg.createdAt).getTime();
  return now.value - createdAt <= RECALL_WINDOW_MS;
};

const recallMessage = async (msg) => {
  if (!msg || !canRecall(msg) || isRecalling(msg._id)) return;
  setRecalling(msg._id, true);
  try {
    const res = await fetch(`${server_ip}/api/message/${msg._id}`, {
      method: 'DELETE',
      headers: { 'token': getToken() }
    });
    const result = await res.json();
    if (res.ok && result.code === 0) {
      if (currentTarget.value?._id) {
        await fetchHistory(currentTarget.value._id);
      }
      await fetchConversations();
    } else {
      alert(result.message || '撤回失败');
    }
  } catch (e) {
    console.error('撤回失败', e);
    alert('撤回失败，请稍后重试');
  } finally {
    setRecalling(msg._id, false);
  }
};

const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value;
};

const selectEmoji = (emoji) => {
  inputContent.value += emoji;
};

const setEmojiCategory = (id) => {
  activeEmojiCategory.value = id;
};

const handleGenerateSticker = async () => {
  if (!stickerPrompt.value.trim()) {
    alert('请输入想要的表情包关键词');
    return;
  }
  isGeneratingSticker.value = true;
  try {
    const res = await fetch(`${server_ip}/api/message/sticker/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': getToken()
      },
      body: JSON.stringify({ prompt: stickerPrompt.value })
    });
    const result = await res.json();
    if (res.ok && result.code === 0) {
    const relativePath = result.data.path || result.data.url;
    const stickerData = {
        url: result.data.url || resolveAssetUrl(relativePath),
        rawUrl: relativePath,
        label: result.data.meta?.tagline || stickerPrompt.value,
        meta: result.data.meta,
        source: 'ai'
    };
      generatedStickers.value = [stickerData, ...generatedStickers.value].slice(0, 6);
      stickerPrompt.value = '';
    } else {
      alert(result.message || '生成表情包失败');
    }
  } catch (err) {
    console.error('生成表情失败', err);
    alert('生成表情包失败，请稍后再试');
  } finally {
    isGeneratingSticker.value = false;
  }
};

const scrollToBottom = () => {
if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
}
};

const formatTime = (isoString) => {
if (!isoString) return '';
const date = new Date(isoString);
const now = new Date();
// 如果是今天，只显示时间
if (date.toDateString() === now.toDateString()) {
    return date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
if (!getToken()) {
    alert('请先登录');
    router.push('/');
    return;
}

await fetchConversations();

const targetId = route.query.target;
if (targetId) {
    const existing = conversations.value.find(c => c.user._id === targetId);
    if (existing) {
    selectConversation(existing.user);
    } else {
    try {
        // 尝试通过 ID 获取用户信息（假设接口兼容 ID）
        // 这里需要注意：如果是username跳转过来的，可能需要先转ID，或者后端接口支持
        // 假设我们有一个接口可以通过 ID 获取详情，或者 search
        // 暂时复用 /api/user/:username，它在 profile.js 中实现了 try findById
        const res = await fetch(`${server_ip}/api/user/${targetId}`);
        const result = await res.json();
        if (result.code === 0 && result.data) {
            const user = {
            _id: result.data.id, 
            username: result.data.username,
            nickname: result.data.nickname,
            avatar: result.data.avatar
            };
            currentTarget.value = user;
            fetchHistory(user._id);
        } else if (result.code === 1002) {
            // 可能是用户名，尝试用 username 再查一次
            // 这里逻辑取决于 targetId 是 id 还是 username
        }
    } catch(e) {
        console.error('加载目标用户失败', e);
    }
    }
}

recallTicker = setInterval(() => {
  now.value = Date.now();
}, 30 * 1000);
});

onUnmounted(() => {
  if (recallTicker) clearInterval(recallTicker);
});
</script>

<style scoped>
.chat-container {
height: 100%;
width: 100%;
padding-left: 70px;
/* padding-top: 70px;  */
background: #000000;
color: #e0e0e0;
display: flex;
justify-content: center;
align-items: center;
}

.chat-layout {
width: 95%;
max-width: 1100px;
height: 85vh;
display: flex;
background: #1e1e1e;
border-radius: 16px;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
overflow: hidden;
border: 1px solid #333;
}

/* Sidebar */
.sidebar {
width: 320px;
border-right: 1px solid #2c2c2c;
display: flex;
flex-direction: column;
background: #1e1e1e;
}

.sidebar-header {
padding: 20px;
border-bottom: 1px solid #2c2c2c;
}

.sidebar-header h3 {
margin: 0;
font-size: 20px;
font-weight: 600;
color: #fff;
}

.conversation-list {
flex: 1;
overflow-y: auto;
}

.conversation-item {
display: flex;
padding: 15px 20px;
cursor: pointer;
transition: background 0.2s;
align-items: center;
}

.conversation-item:hover {
background: #2a2a2a;
}

.conversation-item.active {
background: #2a2a2a;
border-left: 4px solid #42b983;
}

.avatar-wrapper {
position: relative;
margin-right: 15px;
}

.unread-dot {
  position: absolute;
  right: 0;
  top: 0;
  width: 10px;
  height: 10px;
  background: #ff5f5f;
  border-radius: 50%;
  border: 2px solid #1e1e1e;
}

.avatar {
width: 50px;
height: 50px;
border-radius: 50%;
object-fit: cover;
}

.info {
flex: 1;
min-width: 0; /* 允许文本溢出省略 */
}

.top-row {
display: flex;
justify-content: space-between;
align-items: baseline;
margin-bottom: 4px;
}

.time-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name {
font-weight: 600;
font-size: 15px;
color: #fff;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

.time {
font-size: 12px;
color: #888;
white-space: nowrap;
}

.unread-count {
  background: #ff5f5f;
  color: #fff;
  border-radius: 12px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
}

.last-msg {
font-size: 13px;
color: #aaa;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

/* Chat Window */
.chat-window {
flex: 1;
display: flex;
flex-direction: column;
background: #121212; /* 比列表稍深 */
}

.chat-header {
padding: 15px 25px;
border-bottom: 1px solid #2c2c2c;
background: #1e1e1e;
display: flex;
align-items: center;
}

.header-user {
display: flex;
align-items: center;
gap: 12px;
}

.header-avatar {
width: 40px;
height: 40px;
border-radius: 50%;
object-fit: cover;
}

.header-name {
font-weight: 600;
font-size: 17px;
color: #fff;
}

.messages-area {
flex: 1;
padding: 20px;
overflow-y: auto;
display: flex;
flex-direction: column;
gap: 20px;
}

.message-row {
display: flex;
gap: 12px;
max-width: 75%;
}

.message-row.mine {
align-self: flex-end;
flex-direction: row-reverse;
}

.msg-avatar {
width: 36px;
height: 36px;
border-radius: 50%;
align-self: flex-end; /* 头像在底部 */
object-fit: cover;
}

.bubble-container {
display: flex;
flex-direction: column;
}

.bubble-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.message-row.mine .bubble-footer {
  justify-content: flex-end;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #888;
  font-size: 12px;
}

.message-bubble {
padding: 10px 16px;
border-radius: 18px;
font-size: 15px;
line-height: 1.5;
word-wrap: break-word;
word-break: break-word;
position: relative;
}

.message-row:not(.mine) .message-bubble {
background: #2c2c2c;
color: #eee;
border-bottom-left-radius: 4px;
}

.message-row.mine .message-bubble {
background: #42b983; /* 主色调 */
color: #000;
border-bottom-right-radius: 4px;
}

.message-bubble.recalled {
  background: rgba(255, 255, 255, 0.08);
  color: #bbb;
  font-style: italic;
}

.message-row.mine .message-bubble.recalled {
  background: rgba(66, 185, 131, 0.25);
  color: #e6fff4;
}

.bubble-time {
font-size: 11px;
color: #666;
margin-top: 4px;
align-self: flex-start;
}

.mine .bubble-time {
align-self: flex-end;
}

.recall-btn {
  border: 1px solid #4a4a4a;
  background: transparent;
  color: #bbb;
  padding: 2px 10px;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.recall-btn:hover:not(:disabled) {
  border-color: #42b983;
  color: #42b983;
}

.recall-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.read-state {
  font-size: 12px;
  color: #6fcf97;
}

.message-row.mine .read-state {
  color: #c5ffd9;
}

/* Input Area */
.input-wrapper {
padding: 20px;
background: #1e1e1e;
border-top: 1px solid #2c2c2c;
  position: relative;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: none;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  border-color: #42b983;
  color: #42b983;
}

.toolbar-text {
  font-size: 13px;
  color: #bbb;
}

.input-area {
display: flex;
background: #2a2a2a;
border-radius: 24px;
padding: 8px;
align-items: flex-end; /* 文本域增长时按钮在底部 */
}

.input-area textarea {
flex: 1;
background: transparent;
border: none;
color: #fff;
padding: 10px 15px;
resize: none;
height: 44px; /* 初始高度 */
max-height: 120px;
font-family: inherit;
font-size: 15px;
line-height: 24px;
}

.input-area textarea:focus {
outline: none;
}

.send-btn {
background: #42b983;
color: #000;
border: none;
width: 40px;
height: 40px;
border-radius: 50%;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: transform 0.2s, background 0.2s;
margin-left: 8px;
}

.send-btn:hover:not(:disabled) {
background: #3aa876;
transform: scale(1.05);
}

.send-btn:disabled {
background: #444;
color: #888;
cursor: default;
}

.send-icon {
font-size: 18px;
margin-left: 2px; /* 视觉修正 */
}

.emoji-panel {
  margin-top: 12px;
  background: #151515;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 16px;
  max-height: 420px;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.emoji-panel::-webkit-scrollbar {
  width: 6px;
}
.emoji-panel::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
}

.emoji-section {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 16px;
}

.emoji-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.emoji-tab {
  border: none;
  background: rgba(255,255,255,0.05);
  color: #ddd;
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
}

.emoji-tab.active {
  background: #42b983;
  color: #000;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 6px;
}

.emoji-btn {
  font-size: 20px;
  border: none;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.emoji-btn:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.1);
}

.sticker-section h4,
.ai-sticker h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.sticker-pack {
  margin-bottom: 12px;
}

.pack-title {
  margin: 0 0 6px;
  color: #bbb;
  font-size: 13px;
}

.sticker-grid,
.generated-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.sticker-btn {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.sticker-btn img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.sticker-btn:hover {
  border-color: #42b983;
  transform: translateY(-2px);
}

.ai-sticker {
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.ai-subtitle {
  color: #8c8c8c;
  font-size: 12px;
}

.ai-form {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.ai-form input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 12px;
  border-radius: 10px;
  color: #fff;
}

.generate-btn {
  border: none;
  background: #42b983;
  color: #000;
  padding: 0 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-placeholder {
  color: #777;
  font-size: 13px;
}

.generated.sticker-btn {
  border-color: rgba(66, 185, 131, 0.3);
}

.sticker-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
}

.sticker-caption {
  margin-top: 8px;
  font-size: 14px;
  color: #f5f5f5;
  text-align: center;
}

.sticker-bubble {
  background: rgba(255,255,255,0.08);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.no-chat-selected {
flex: 1;
display: flex;
justify-content: center;
align-items: center;
color: #666;
flex-direction: column;
}

.placeholder-icon {
font-size: 48px;
margin-bottom: 16px;
opacity: 0.5;
}

/* Scrollbar */
::-webkit-scrollbar {
width: 6px;
}
::-webkit-scrollbar-track {
background: transparent;
}
::-webkit-scrollbar-thumb {
background: #444;
border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
background: #555;
}

.empty-state {
  display: flex;                  /* 使用 flex 布局 */
  justify-content: center;        /* 水平居中 */
  align-items: center;            /* 垂直居中 */
  height: 200px;                  /* 高度可根据需求调整 */
  color: #999999;                 /* 字体颜色柔和 */
  font-size: 16px;                /* 字体大小 */
  font-weight: 500;               /* 字体粗细 */
  border-radius: 8px;             /* 圆角，可选 */
  text-align: center;             /* 多行文字居中 */
  padding: 20px;                  /* 内边距 */
}
</style>