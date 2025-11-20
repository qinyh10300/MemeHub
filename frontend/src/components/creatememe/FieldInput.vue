<template>
    <div class="field">
        <label>{{ label }}</label>
        <input 
            :placeholder="placeholder"
            :value="modelValue"
            @input="onInput"
        />
    </div>
</template>

<script setup>
const props = defineProps({
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    modelValue: { type: String, default: '' }  // v-model 关键
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) {
    emit('update:modelValue', e.target.value)
}
</script>



<style scoped>
.field{ display:flex; flex-direction:column }
.field label{ font-size:13px; color:var(--muted); margin-bottom:6px }
.field input{ background:transparent; border:1px solid rgba(255,255,255,0.25); padding:10px 12px; border-radius:8px; color:var(--fg) }
.field input::placeholder{ color:rgba(255, 255, 255, 0.7) }
</style>