<template>
	<div class="home">
		<div class="brandHero">
			<BrandMark :size="148" subtitle="Community-driven DEX" :nameSize="26" :subSize="14" />
		</div>
		<div class="viewSwitch">
			<span class="label">View</span>
			<div class="seg">
				<button
					class="segBtn"
					:class="{ active: viewMode === 'grid' }"
					type="button"
					@click="viewMode = 'grid'"
				>
					Grid
				</button>
				<button
					class="segBtn"
					:class="{ active: viewMode === 'list' }"
					type="button"
					@click="viewMode = 'list'"
				>
					List
				</button>
			</div>
		</div>
		<Coins v-if="viewMode === 'grid'" />
		<MarketList v-else />
	</div>
</template>

<script setup>
import { ref } from "vue";
import Coins from "../components/Coins.vue";
import MarketList from "../components/MarketList.vue";
import BrandMark from "../components/BrandMark.vue";

const viewMode = ref("grid");
</script>

<style scoped>
.home {
	max-width: 1280px;
	width: 100%;
	margin: 0 auto;
}

.brandHero {
	display: flex;
	justify-content: center;
	margin: 34px 0 22px;
}

.viewSwitch {
	display: flex;
	align-items: center;
	gap: 10px;
	justify-content: flex-end;
	margin: 8px 0 12px;
}

.label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.6);
}

.seg {
	display: inline-flex;
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	padding: 2px;
	gap: 2px;
}

.segBtn {
	appearance: none;
	border: 0;
	background: transparent;
	color: rgba(255, 255, 255, 0.8);
	padding: 6px 12px;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
}

.segBtn.active {
	background: rgba(0, 208, 132, 0.22);
	color: rgba(255, 255, 255, 0.95);
}
</style>
