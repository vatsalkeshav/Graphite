<script lang="ts">
	import { IMAGE_BASE64_STRINGS } from "@graphite/utility-functions/images";

	let className = "";
	export { className as class };
	export let classes: Record<string, boolean> = {};

	export let image: string;
	export let width: string | undefined;
	export let height: string | undefined;
	export let tooltip: string | undefined = undefined;
	export let disabled = false;
	// Callbacks
	export let action: (e?: MouseEvent | KeyboardEvent) => void;

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			action(event);
		}
	}

	$: extraClasses = Object.entries(classes)
		.flatMap(([className, stateName]) => (stateName ? [className] : []))
		.join(" ");
</script>

<button type="button" class={`image-button ${className} ${extraClasses}`.trim()} title={tooltip} on:click={action} on:keydown={handleKeyDown} {disabled} aria-label={tooltip}>
	<img src={IMAGE_BASE64_STRINGS[image]} style:width style:height alt="" />
</button>

<style lang="scss" global>
	.image-button {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus-visible {
			outline: 2px solid var(--color-f-white);
			outline-offset: 2px;
		}

		img {
			width: auto;
			height: auto;
		}

		+ .image-button {
			margin-left: 8px;
		}
	}
</style>
