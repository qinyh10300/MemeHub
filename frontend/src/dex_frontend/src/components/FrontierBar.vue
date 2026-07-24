<template>
	<header class="frontierbar">
		<div class="inner">
			<div class="left">
				<BrandMark :size="40" :compact="false" subtitle="" :nameSize="20" badge />
			</div>
			<div class="right">
				<slot />
			</div>
		</div>
	</header>
</template>

<script setup>
import BrandMark from "./BrandMark.vue";
</script>

<style scoped>
.frontierbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 72px;
	z-index: 50;
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(86, 195, 255, 0.08), transparent 60%),
		#0b0f14;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.inner {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 0 16px;
}

.left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.right {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 10px;
	min-width: 0;
}
</style>
