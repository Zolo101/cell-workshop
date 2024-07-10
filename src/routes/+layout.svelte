<script>
    import "../app.css";
</script>

<svelte:head>
	<title>Collapsibles!</title>
</svelte:head>

<header>
	<div class="flex bg-neutral-800 gap-10 px-10 py-2">
		<div class="flex md:flex-col text-yellow-400/70">
			<div class="flex items-end">
				<h2 class="inline text-3xl font-black italic">Collapsibles!</h2>
				<span class="text-xs">0.1.0</span>
			</div>
			<span class="text-xl">by <a href="https://zelo.dev">zelo.dev</a></span>
	<!--		<span class="text-xl">•</span>-->
	<!--		<span class="text-xl">Github</span>-->
		</div>
		<div class="text-sm text-green-500 max-md:hidden">
			<p><i>Collapsibles!</i> is a website that allows you create pixel art using a wide selection of procedural algorithms that will eventually <b>collapse</b> (or converge) into a stable image!</p>
			<p class="text-xs">This was heavily inspired by <a href="https://github.com/TodePond/CellPond">CellPond</a>, <a href="https://github.com/mxgmn/MarkovJunior">MarkovJunior</a> and its frontend <a href="https://yuu6883.github.io/MarkovJuniorWeb/">MarkovJuniorWeb</a>. Please check out these sites if you want to learn more about this!</p>
		</div>
	</div>
</header>
<main>
	<slot></slot>
</main>
