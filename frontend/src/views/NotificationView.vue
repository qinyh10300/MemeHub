<template>
<div class="container">
    <!-- Tabs -->
    <div class="tabs">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="active = tab.id"
            :class="['tab-item', active === tab.id ? 'active' : 'inactive']"
        >
            {{ tab.label }}
            <span v-if="unreadCount(tab.id)" class="unread-count">
                ({{ unreadCount(tab.id) }})
            </span>
        </button>
    </div>

    <!-- 消息列表 -->
    <div class="message-list">
        <div
            v-for="msg in data[active]"
            :key="msg.id"
            class="message-item"
            :class="msg.isRead ? 'message-read' : 'message-unread'"
            @click="markAsRead(active, msg._id)"
        >
            <div class="message-text">
                {{ msg.message }}
            </div>
            <div class="message-time">
                {{ formatTime(msg.createdAt) }}
            </div>
            <div class="message-status">
                {{ msg.isRead ? '已读' : '未读' }}
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const server_ip = authStore.server_ip // 后端服务器地址
const user_token = authStore.user_token // user token

const tabs = [
    { id: 'work', label: '模因作品' },
    { id: 'interaction', label: '互动' },
    { id: 'coin', label: '模因币' }
]

const data = ref({
    work: [],
    interaction: [],
    coin: []
})

const active = ref('work')

// 未读消息计数
const unreadCount = (tabId) => data.value[tabId].filter(x => !x.isRead).length

// 获取所有分类的消息数据
const fetchNotifications = async () => {
    try {
    const response = await fetch(`${server_ip}/api/notifications`, {
        method: 'GET',
        headers: {
        'token': user_token,
        'Content-Type': 'application/json'
        }
    });

    const response_data = await response.json();
    // console.log(response_data)

    if (response_data.code == 0) {
        // 将消息分类存储到对应的字段中
        const notifications = response_data.notifications
        data.value.work = notifications.filter(n => n.type === 'work')
        data.value.interaction = notifications.filter(n => n.type === 'interaction')
        data.value.coin = notifications.filter(n => n.type === 'coin')
    } else {
        console.error('获取通知失败:', response_data.message)
    }
    } catch (error) {
    console.error('获取消息失败:', error)
    }
    console.log(data)
}

// 格式化时间
const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

// 标记消息为已读
const markAsRead = async (tabId, msgId) => {
    try {
    const response = await fetch(`${server_ip}/api/mark-notification-read`, {
        method: 'POST',
        headers: {
        'token': user_token,
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        notificationIds: [msgId]
        })
    });

    const response_data = await response.json();
    console.log("response_data: ", response_data);

    if (response_data.code === 0) {
        // 更新前端状态
        // console.log("tabId: ", tabId)
        // console.log("data.value[tabId]: ", data.value[tabId])
        const message = data.value[tabId].find(m => m._id === msgId);
        // console.log("message: ", message)
        if (message) {
            // message.isRead = !message.isRead; // 切换已读/未读状态
            message.isRead = true; // 只能标记为已读，无法标记为未读
        }
    } else {
        console.error('标记已读失败:', response_data.message);
    }
    } catch (error) {
    console.error('更新消息状态失败:', error);
    }
}

// 初始化加载数据
onMounted(() => {
    fetchNotifications()
})
</script>

<style scoped>
/* container */
.container {
width: 100%;
max-width: 600px;
position: relative; /* 或 absolute */
top: 40px; 
left: 100px;
padding: 16px;
color: white;
}

/* Tabs */
.tabs {
display: flex;
justify-content: space-between;
border-bottom: 1px solid #444;
margin-bottom: 16px;
}

.tab-item {
padding: 8px 12px;
font-size: 18px;
cursor: pointer;
background: transparent;
border: none;
}

.tab-item.active {
border-bottom: 2px solid white;
font-weight: bold;
color: white;
}

.tab-item.inactive {
color: #888;
}

.unread-count {
font-size: 14px;
color: #ff6b6b;
margin-left: 4px;
}

/* Messages */
.message-list {
display: flex;
flex-direction: column;
gap: 14px;
}

.message-item {
padding: 10px 14px;
border-radius: 8px;
cursor: pointer;
background: #222;
}

.message-item:hover {
background: #2d2d2d;
}

.message-unread .message-text {
font-weight: bold;
color: white;
}

.message-read .message-text {
color: #9e9e9e;
}

.message-unread .message-time {
margin-top: 4px;
font-size: 12px;
color: #ffffff;
}

.message-read .message-time {
margin-top: 4px;
font-size: 12px;
color: #777;
}

.message-unread .message-status {
margin-top: 4px;
font-size: 12px;
color: #ffffff;
}

.message-read .message-status {
margin-top: 4px;
font-size: 12px;
color: #777;
}
</style>
