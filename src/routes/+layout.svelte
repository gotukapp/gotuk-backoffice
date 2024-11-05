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
        }
    });


</script>

{@render children()}
