<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { page } from '$app/stores';
    import { auth } from '$lib'
    import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import {
        ChartPieSolid,
        UserSolid,
        ArrowRightToBracketOutline,
        EditOutline,
        ProfileCardSolid, TruckSolid, LandmarkSolid
    } from 'flowbite-svelte-icons';
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";
    let spanClass = 'flex-1 ms-3 whitespace-nowrap';
    let {data, children} = $props()
    let activeUrl = $state('');

    onMount(async () => {
      activeUrl = $page.url.pathname;
    })

    async function signOut() {
        await auth.signOut()
        goto('/login')
    }
</script>
<div class="flex flex-col h-dvh">
<Navbar class="bg-gray-200">
    {#await data.getAuthUser()}
        <div></div>
    {:then user}
    <NavBrand href="/">
        <img src="/applogo.png" class="me-3 h-6 sm:h-9" alt="Logo" />
        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">GoTuk</span>
    </NavBrand>
    <div class="flex items-center md:order-2">
        <Avatar id="avatar-menu" src="https://ui-avatars.com/api/?name={user.displayName}" />
        <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
    </div>
    <Dropdown placement="bottom" triggeredBy="#avatar-menu">
        <DropdownHeader>
            <span class="block text-sm">{user.displayName}</span>
            <span class="block truncate text-sm font-medium">{user.email}</span>
        </DropdownHeader>
        <DropdownItem>Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem on:click={signOut}>Sign out</DropdownItem>
    </Dropdown>
    {/await}
    <NavUl>
        <NavLi href="/" active={true}>Home</NavLi>
        <NavLi href="/about">About</NavLi>
        <NavLi href="/contact">Contact</NavLi>
    </NavUl>
</Navbar>
    <div class="flex h-full">
<Sidebar {activeUrl} >
    <SidebarWrapper class="h-full">
        <SidebarGroup>
            <SidebarItem label="Dashboard">
                <svelte:fragment slot="icon">
                    <ChartPieSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Trips" href="/trips" on:click={() => activeUrl = '/trips'} active={activeUrl === '/trips'}>
                <svelte:fragment slot="icon">
                    <TruckSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Guides" href="/guides" on:click={() => activeUrl = '/guides'} active={activeUrl === '/guides'}>
                <svelte:fragment slot="icon">
                    <ProfileCardSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Clients" href="/clients" on:click={() => activeUrl = '/clients'} active={activeUrl === '/clients'}>
                <svelte:fragment slot="icon">
                    <UserSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Tours" href="/tours" on:click={() => activeUrl = '/tours'} active={activeUrl === '/tours'}>
                <svelte:fragment slot="icon">
                    <LandmarkSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Sign In">
                <svelte:fragment slot="icon">
                    <ArrowRightToBracketOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Sign Up">
                <svelte:fragment slot="icon">
                    <EditOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
            </SidebarItem>
        </SidebarGroup>
    </SidebarWrapper>

</Sidebar>
        {@render children()}
    </div>
</div>

