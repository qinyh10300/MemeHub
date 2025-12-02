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
            </div>
            <div class="info">
            <div class="top-row">
                <div class="name">{{ conv.user.nickname || conv.user.username }}</div>
                <div class="time">{{ formatTime(conv.lastMessage.createdAt) }}</div>
            </div>
            <div class="last-msg">
                {{ conv.lastMessage.isSelf ? '我: ' : '' }}{{ conv.lastMessage.content }}
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
                <div class="message-bubble">
                {{ msg.content }}
                </div>
                <div class="bubble-time">{{ formatTime(msg.createdAt) }}</div>
            </div>
            </div>
        </div>

        <div class="input-wrapper">
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
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const server_ip = authStore.server_ip || 'http://localhost:3000';

const conversations = ref([]);
const messages = ref([]);
const currentTarget = ref(null);
const inputContent = ref('');
const messagesContainer = ref(null);

// 获取 Token 的辅助函数
const getToken = () => authStore.token || localStorage.getItem('auth_token') || authStore.username || '';

// 获取会话列表
const fetchConversations = async () => {
try {
    const res = await fetch(`${server_ip}/api/message/conversations`, {
    headers: { 'token': getToken() }
    });
    const result = await res.json();
    if (result.code === 0) {
    conversations.value = result.data;
    }
} catch (e) {
    console.error('获取会话失败', e);
}
};

// 获取聊天记录
const fetchHistory = async (targetId) => {
try {
    const res = await fetch(`${server_ip}/api/message/history/${targetId}`, {
    headers: { 'token': getToken() }
    });
    const result = await res.json();
    if (result.code === 0) {
    messages.value = result.data;
    await nextTick();
    scrollToBottom();
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
    await fetchHistory(currentTarget.value._id); // 刷新记录
    await fetchConversations(); // 刷新列表以更新最新消息
    }
} catch (e) {
    console.error('发送失败', e);
}
};

// 选择会话
const selectConversation = (user) => {
currentTarget.value = user;
fetchHistory(user._id);
router.replace(`/chat?target=${user._id}`);
};

const scrollToBottom = () => {
if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
}
};

const formatTime = (isoString) => {
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

.bubble-time {
font-size: 11px;
color: #666;
margin-top: 4px;
align-self: flex-start;
}

.mine .bubble-time {
align-self: flex-end;
}

/* Input Area */
.input-wrapper {
padding: 20px;
background: #1e1e1e;
border-top: 1px solid #2c2c2c;
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
</style>