<template>
<div class="c2c-container">

    <!-- ========== 发起交易区域 ========== -->
    <h2 class="title">发起 C2C 交易</h2>

    <div class="form">
    <input v-model="targetUser" placeholder="对方用户名" />

    <div class="row">
        <input v-model="myToken" placeholder="我付出的币种，如 DOGE" />
        <input
        v-model.number="myAmount"
        type="number"
        placeholder="数量"
        />
    </div>

    <div class="row">
        <input v-model="theirToken" placeholder="对方付出的币种，如 CAT" />
        <input
        v-model.number="theirAmount"
        type="number"
        placeholder="数量"
        />
    </div>

    <button @click="createTrade">发起交易</button>
    </div>

    <hr />

    <!-- ========== 我发起的交易 ========== -->
    <h3 class="section-title">我发起的交易</h3>

    <div v-if="outgoingTrades.length === 0" class="empty">
    暂无发起的交易
    </div>

    <div
    class="trade-card"
    v-for="trade in outgoingTrades"
    :key="trade.id"
    >
    <div class="trade-info">
        <p>
        <strong>对方:</strong> @{{ trade.to }}
        </p>
        <p>
        <strong>我付出:</strong> {{ trade.myToken }} ×
        {{ trade.myAmount }}
        </p>
        <p>
        <strong>对方付出:</strong> {{ trade.theirToken }} ×
        {{ trade.theirAmount }}
        </p>
        <p>
        <strong>状态:</strong>
        <span :class="trade.status">{{ trade.status }}</span>
        </p>
    </div>
    </div>

    <hr />

    <!-- ========== 我收到的交易 ========== -->
    <h3 class="section-title">我收到的交易</h3>

    <div v-if="incomingTrades.length === 0" class="empty">
    暂无收到的交易
    </div>

    <div
    class="trade-card"
    v-for="trade in incomingTrades"
    :key="trade.id"
    >
    <div class="trade-info">
        <p>
        <strong>来自:</strong> @{{ trade.from }}
        </p>
        <p>
        <strong>对方付出:</strong> {{ trade.myToken }} ×
        {{ trade.myAmount }}
        </p>
        <p>
        <strong>我付出:</strong> {{ trade.theirToken }} ×
        {{ trade.theirAmount }}
        </p>
    </div>

    <div class="actions">
        <button class="btn accept" @click="acceptTrade(trade.id)">
        接受
        </button>
        <button class="btn reject" @click="rejectTrade(trade.id)">
        拒绝
        </button>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref } from "vue";

// 表单字段
const targetUser = ref("");
const myToken = ref("");
const myAmount = ref(null);
const theirToken = ref("");
const theirAmount = ref(null);

// 假设当前用户（真实环境应从 auth store 获取）
const currentUser = "myself";

// 本地模拟数据
const outgoingTrades = ref([]);
const incomingTrades = ref([]);

// 发起 C2C
function createTrade() {
if (!targetUser.value) return alert("请输入对方用户名");

const trade = {
    id: Date.now(),
    from: currentUser,
    to: targetUser.value,
    myToken: myToken.value,
    myAmount: myAmount.value,
    theirToken: theirToken.value,
    theirAmount: theirAmount.value,
    status: "pending", // pending / accepted / rejected
};

outgoingTrades.value.push(trade);

// ❗模拟：对方收到该交易
// 实际应发送到后端
incomingTrades.value.push({
    ...trade,
    id: trade.id + "_incoming",
});

// 清空表单
targetUser.value = "";
myToken.value = "";
myAmount.value = null;
theirToken.value = "";
theirAmount.value = null;
}

// 接受交易
function acceptTrade(id) {
const trade = incomingTrades.value.find((t) => t.id === id);
if (trade) trade.status = "accepted";

// 同步更新 outgoing
const out = outgoingTrades.value.find((t) => t.id === parseInt(id));
if (out) out.status = "accepted";
}

// 拒绝交易
function rejectTrade(id) {
const trade = incomingTrades.value.find((t) => t.id === id);
if (trade) trade.status = "rejected";

const out = outgoingTrades.value.find((t) => t.id === parseInt(id));
if (out) out.status = "rejected";
}
</script>

<style scoped>
.c2c-container {
padding: 20px;
color: white;
height: 100%;
overflow-y: auto;
}

.title {
font-size: 20px;
font-weight: bold;
margin-bottom: 16px;
}

.form input {
width: 100%;
padding: 8px 12px;
margin-bottom: 10px;
border-radius: 8px;
background: #1a1a1a;
border: 1px solid #333;
color: white;
}

.row {
display: flex;
gap: 10px;
}

button {
width: 100%;
padding: 10px;
background: #2b9547;
color: white;
border-radius: 10px;
border: none;
cursor: pointer;
}

.section-title {
margin: 18px 0 10px;
font-weight: bold;
opacity: 0.9;
}

.trade-card {
background: #111;
padding: 14px;
margin-bottom: 12px;
border-radius: 12px;
border: 1px solid #222;
}

.trade-info p {
margin: 4px 0;
}

.pending {
color: #ffaa00;
}

.accepted {
color: #4caf50;
}

.rejected {
color: #ff4444;
}

.actions {
display: flex;
gap: 10px;
margin-top: 10px;
}

.btn {
padding: 8px 12px;
border-radius: 8px;
color: white;
border: none;
cursor: pointer;
}

.accept {
background: #207820;
}

.reject {
background: #aa1e1e;
}

.empty {
opacity: 0.6;
font-size: 14px;
margin-bottom: 10px;
}
</style>
