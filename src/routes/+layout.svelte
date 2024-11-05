<script>
	import '../app.css';
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
	let { children, data } = $props();
    onMount(async () => {
        const user = await data.getAuthUser();
        const loggedIn = !!user && user?.emailVerified;
        if (!loggedIn) {
            goto('/login');
        } else {
            goto('/main');
        }
    });


</script>
<div class="bg-gray-100">
    {@render children()}
</div>
