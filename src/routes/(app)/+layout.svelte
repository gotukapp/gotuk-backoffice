<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { page } from '$app/stores';
    import { auth } from '$lib'
    import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { ChartPieSolid, GridSolid, MailBoxSolid, UserSolid, ArrowRightToBracketOutline, EditOutline } from 'flowbite-svelte-icons';
    import {goto} from "$app/navigation";
    let spanClass = 'flex-1 ms-3 whitespace-nowrap';
    let {data, children} = $props()
    let activeUrl = $page.url.pathname;
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
        <img src="" class="me-3 h-6 sm:h-9" alt="Logo" />
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
            <SidebarItem label="Kanban" {spanClass}>
                <svelte:fragment slot="icon">
                    <GridSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
                <svelte:fragment slot="subtext">
                    <span class="inline-flex justify-center items-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300"> Pro </span>
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Inbox" {spanClass}>
                <svelte:fragment slot="icon">
                    <MailBoxSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </svelte:fragment>
                <svelte:fragment slot="subtext">
                    <span class="inline-flex justify-center items-center p-3 ms-3 w-3 h-3 text-sm font-medium text-primary-600 bg-primary-200 rounded-full dark:bg-primary-900 dark:text-primary-200"> 3 </span>
                </svelte:fragment>
            </SidebarItem>
            <SidebarItem label="Sidebar" href="/docs/components/sidebar" active={activeUrl === '/docs/components/sidebar'}>
                <svelte:fragment slot="icon">
                    <UserSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
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

