<script>
	import '../app.css';
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {auth} from '$lib'
    import { locale } from '$lib/i18n';
    import {login, authUser} from '$lib/stores/authUser.js'

	let { children, data } = $props();
    onMount(async () => {
        locale.set('en');
        const user = await data.getAuthUser();
        const loggedIn = !!user && user?.emailVerified;
        if (!loggedIn && auth.currentUser === null) {
            goto('/login');
        } else {
            await login(user)
            if ($authUser.isAdmin) {
                if (data.url.length === 0) {
                    goto('/dashboard');
                }
            } else {
                if ($authUser.user?.organizationRef === undefined) {
                    goto('/organizations/create')
                } else {
                    if (data.url.length === 0) {
                        goto('/organizations/' + $authUser.user?.organizationRef.id)
                    }
                }
            }
        }
    });
</script>
<div class="bg-gray-100">
    {@render children()}
</div>
