<script>
    import "../app.css";
</script>

<svelte:head>
	<title>Cell Workshop</title>
	<link rel="icon" href="favicon.png"/>
</svelte:head>

<header>
	<div class="flex bg-neutral-800 gap-10 px-10 py-2">
		<div class="flex md:flex-col text-yellow-400/70">
			<div class="flex items-end">
				<h2 class="inline text-3xl font-black italic">Cell Workshop</h2>
				<span class="text-xs">alpha 0.1.0</span>
			</div>
			<span class="text-xl">from <a href="https://zelo.dev">zelo.dev</a></span>
	<!--		<span class="text-xl">•</span>-->
	<!--		<span class="text-xl">Github</span>-->
		</div>
		<div class="text-sm text-green-500 max-md:hidden">
			<p>This allows you create pixel art using simple rules. Currently a work in progress, with loads more features to come!</p>
			<p class="text-xs">This was heavily inspired by <a href="https://github.com/TodePond/CellPond">CellPond</a>, <a href="https://github.com/mxgmn/MarkovJunior">MarkovJunior</a> and its frontend <a href="https://yuu6883.github.io/MarkovJuniorWeb/">MarkovJuniorWeb</a>.</p>
			<a href="https://github.com/Zolo101/unnamed-cellular-automata-project">Source Code</a>
			<span>•</span>
			<a href="https://discord.gg/YVuuF9KB5j">Discord</a>
		</div>
	</div>
</header>
<main>
	<slot></slot>
</main>
