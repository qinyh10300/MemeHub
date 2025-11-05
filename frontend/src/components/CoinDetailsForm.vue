<template>
    <div class="coin-details">
        <h2>Coin details</h2>
        <p class="sub">Choose carefully, these can't be changed once the coin is created</p>

        <div class="row">
            <field-input
                label="Coin name"
                placeholder="Name your coin"
                class="half"
                v-model="localCoinname"
            />
            <field-input
                label="Ticker"
                placeholder="Add a coin ticker (e.g. DOGE)"
                class="half"
                v-model="localticker"
            />
        </div>

        <text-area label="Description (Optional)" placeholder="Write a short description" />

        <expandable-section title="Add social links">
            <div class="social-grid">
                <field-input label="Website" placeholder="Add URL" />
                <field-input label="X" placeholder="Add URL" />
                <field-input label="Telegram" placeholder="Add URL" />
            </div>
        </expandable-section>
    </div>
</template>

<script setup>
import { watch, toRefs } from 'vue'
import FieldInput from './FieldInput.vue'
import TextArea from './TextArea.vue'
import ExpandableSection from './ExpandableSection.vue'

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
})
const emit = defineEmits(['update:modelValue'])

const { coinname, ticker } = toRefs(props.modelValue)
const localCoinname = ref(coinname.value)
const localticker = ref(ticker.value)

watch([localCoinname, localticker], ([newCoinname, newticker]) => {
    emit('update:modelValue', { coinname: newCoinname, ticker: newticker })
})

watch(props.modelValue, (newVal) => {
    localCoinname.value = newVal.coinname
    localticker.value = newVal.ticker
})
</script>