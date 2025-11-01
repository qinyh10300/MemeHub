<template>
    <div class="coin-details">
        <h2>Coin details</h2>
        <p class="sub">Choose carefully, these can't be changed once the coin is created</p>


        <div class="row">
            <field-input label="Coin name" placeholder="Name your coin" class="half" />
            <field-input label="Ticker" placeholder="Add a coin ticker (e.g. DOGE)" class="half" />
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
import FieldInput from './FieldInput.vue'
import TextArea from './TextArea.vue'
import ExpandableSection from './ExpandableSection.vue'
</script>


<style scoped>
.coin-details{ padding:18px }
.coin-details h2{ margin:0; font-size:16px }
.sub{ color:var(--muted); margin-top:6px; font-size:13px }
.row{ display:flex; gap:20px; margin-top:16px }
.row .half{ flex:1 }
.social-toggle{ margin-top:12px; background:rgba(255,255,255,0.02); padding:10px; border-radius:8px }
.social-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px }
</style>