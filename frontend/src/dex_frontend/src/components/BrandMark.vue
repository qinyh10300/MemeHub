<template>
	<div class="brand" :class="{ compact }">
		<!-- <div v-if="logoSrc && badge" class="logoWrap" :style="{ width: sizePx + 'px', height: sizePx + 'px' }">
			<img class="logoIn" :src="logoSrc" alt="DHC" />
		</div> -->
		<!-- <img
			v-else-if="logoSrc"
			class="logo"
			:style="{ width: sizePx + 'px', height: sizePx + 'px' }"
			:src="logoSrc"
			alt="DHC"
		/> -->

		<!-- <div class="text">
			<div class="name" :style="nameStyle">DarkHorse Community</div>
			<div v-if="!compact && subtitle" class="sub" :style="subStyle">{{ subtitle }}</div>
		</div> -->
	</div>
</template>

<script setup>
import { computed } from "vue";

const extractedSvg = import.meta.glob("../assets/brand/dhc.svg", {
	eager: true,
	import: "default",
});
const extractedPng = import.meta.glob("../assets/brand/dhc.png", {
	eager: true,
	import: "default",
});
const extractedJpg = import.meta.glob("../assets/brand/dhc.jpg", {
	eager: true,
	import: "default",
});

const logoSrc =
	extractedSvg["../assets/brand/dhc.svg"] ||
	extractedPng["../assets/brand/dhc.png"] ||
	extractedJpg["../assets/brand/dhc.jpg"] ||
	"";

const props = defineProps({
	size: { type: Number, default: 44 },
	compact: { type: Boolean, default: false },
	subtitle: { type: String, default: "Community-driven DEX" },
	nameSize: { type: Number, default: undefined },
	subSize: { type: Number, default: undefined },
	badge: { type: Boolean, default: false },
});

const sizePx = computed(() => {
	const n = Number(props.size);
	return Number.isFinite(n) && n > 12 ? Math.floor(n) : 44;
});

const nameStyle = computed(() => {
	const base = props.compact ? 16 : 18;
	const n = Number(props.nameSize);
	const px = Number.isFinite(n) && n >= 12 ? Math.floor(n) : base;
	return { fontSize: px + "px" };
});

const subStyle = computed(() => {
	const base = 13;
	const n = Number(props.subSize);
	const px = Number.isFinite(n) && n >= 10 ? Math.floor(n) : base;
	return { fontSize: px + "px" };
});
</script>

<style scoped>
.brand {
	display: inline-flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.logo {
	flex: 0 0 auto;
	filter: drop-shadow(0 0 14px rgba(0, 208, 132, 0.16));
	object-fit: contain;
	image-rendering: auto;
}

.logoWrap {
	flex: 0 0 auto;
	box-sizing: border-box;
	padding: 0;
	border-radius: 999px;
	overflow: hidden;
	background: transparent;
	border: 0;
	filter: drop-shadow(0 0 12px rgba(0, 208, 132, 0.14));
}

.logoIn {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 999px;
}

.text {
	min-width: 0;
}

.name {
	font-weight: 900;
	letter-spacing: 0.02em;
	color: rgba(255, 255, 255, 0.92);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.sub {
	margin-top: 2px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.55);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
