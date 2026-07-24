<template>
  <div class="dex-debug">
    <div class="title">DEX Debug</div>

    <div class="row">
      <button class="btn" :disabled="loading" @click="onCall">
        {{ loading ? "Calling..." : "callDex(getOrderBookDepthFor)" }}
      </button>
      <span v-if="error" class="error">{{ error }}</span>
    </div>

    <pre v-if="result" class="result">{{ result }}</pre>

    <div class="hint">
      Please put the ABI into <code>src/abi/dex.abi.json</code>; otherwise the ABI will be empty.
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDex } from "../lib/useDex";

const dex = useDex();

const loading = ref(false);
const error = ref("");
const result = ref("");

async function onCall() {
  error.value = "";
  result.value = "";

  if (!dex) {
    error.value = "DEX not injected: make sure main.js calls use(DexPlugin)";
    return;
  }

  loading.value = true;
  try {
    // Note: the parameter signature must match your ABI. This only demonstrates the call entry.
    const res = await dex.callDex("getOrderBookDepthFor");
    result.value = typeof res === "string" ? res : JSON.stringify(res, null, 2);
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dex-debug {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.title {
  font-weight: 600;
  margin-bottom: 10px;
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: rgba(255, 110, 110, 0.9);
}

.result {
  margin-top: 10px;
  font-size: 12px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  overflow: auto;
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.8;
}

code {
  background: rgba(0, 0, 0, 0.25);
  padding: 2px 6px;
  border-radius: 6px;
}
</style>
