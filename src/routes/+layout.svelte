<script>
	import '../app.css';
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {auth} from '$lib'
	let { children, data } = $props();
    onMount(async () => {
        const user = await data.getAuthUser();
        const loggedIn = !!user && user?.emailVerified;
        if (!loggedIn && auth.currentUser === null) {
            goto('/login');
        } else {
            goto('/main');
        }
    });
</script>
<div class="bg-gray-100">
    {@render children()}
</div>
