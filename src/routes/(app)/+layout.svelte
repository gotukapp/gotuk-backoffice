<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { page } from '$app/stores';
    import { auth } from '$lib'
    import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import {
        ChartPieSolid,
        UserSolid,
        ProfileCardSolid, TruckSolid, LandmarkSolid, StoreSolid, MapPinAltSolid, CalendarMonthSolid

    } from 'flowbite-svelte-icons';
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";
    import {logout, authUser} from '$lib/stores/authUser.js'
    import { _ } from 'svelte-i18n';

    let {data, children} = $props()
    let activeUrl = $state('');
    let faqUrl = $state('');

    onMount(async () => {
        let lang = navigator.language.slice(0, 2).toUpperCase() || 'EN';

        activeUrl = $page.url.pathname;
        faqUrl = lang === 'PT' ? 'https://firebasestorage.googleapis.com/v0/b/app-gotuk.appspot.com/o/documents%2FFAQs_Orgs_PT.pdf?alt=media&token=174e12ec-9b2e-4956-a26c-00d8271c5fe9'
            : 'https://firebasestorage.googleapis.com/v0/b/app-gotuk.appspot.com/o/documents%2FFAQs_Orgs_EN.pdf?alt=media&token=5ababce4-73f4-4af6-9e9a-f09704659756'
    })

    async function signOut() {
        await auth.signOut()
        logout()
        await goto('/login')
    }
</script>
<div class="flex flex-col h-dvh">
<Navbar class="bg-gray-200">
    {#await data.getAuthUser()}
        <div></div>
    {:then user}
        <NavBrand href="/">
            <img src="/applogo.png" class="me-3 h-6 sm:h-9" alt="Logo" />
            <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">GoTuk - {#if $authUser.isAdmin}Backoffice{:else}Empresas{/if}</span>
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
            <DropdownItem on:click={() => goto("/settings")}>{$_('settings')}</DropdownItem>
            <DropdownDivider />
            <DropdownItem on:click={signOut}>{$_('logout')}</DropdownItem>
        </Dropdown>
        {#if $authUser.isAdmin === true}
            <NavUl>
                <NavLi href="/dashboard" active={true}>{$_('home')}</NavLi>
                <NavLi href={faqUrl} target="_blank">FAQs</NavLi>
                <NavLi href="https://gotuk.freshdesk.com/" target="_blank">Tickets</NavLi>
                <NavLi href="/contacts">{$_('contacts')}</NavLi>
            </NavUl>
        {:else}
            {#if $authUser.user?.organizationRef !== undefined}
                <NavUl>
                    <NavLi href="/organization" active={true}>{$_('home')}</NavLi>
                    <NavLi href={faqUrl} target="_blank">FAQs</NavLi>
                    <NavLi href="/contacts">{$_('contacts')}</NavLi>
                </NavUl>
            {/if}
        {/if}
    {/await}
</Navbar>
    <div class="flex h-full">
        {#if $authUser.isAdmin === true}
            <Sidebar {activeUrl} >
                <SidebarWrapper class="h-full">
                <SidebarGroup>
                    <SidebarItem label="Dashboard" href="/dashboard">
                        <svelte:fragment slot="icon">
                            <ChartPieSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Reservas" href="/trips" on:click={() => activeUrl = '/trips'} active={activeUrl === '/trips'}>
                        <svelte:fragment slot="icon">
                            <MapPinAltSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Guias" href="/guides" on:click={() => activeUrl = '/guides'} active={activeUrl === '/guides'}>
                        <svelte:fragment slot="icon">
                            <ProfileCardSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Clientes" href="/clients" on:click={() => activeUrl = '/clients'} active={activeUrl === '/clients'}>
                        <svelte:fragment slot="icon">
                            <UserSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Tours" href="/tours" on:click={() => activeUrl = '/tours'} active={activeUrl === '/tours'}>
                        <svelte:fragment slot="icon">
                            <LandmarkSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Tuks" href="/tuks" on:click={() => activeUrl = '/tuks'} active={activeUrl === '/tuks'}>
                        <svelte:fragment slot="icon">
                            <TruckSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                    <SidebarItem label="Empresas" href="/organizations" on:click={() => activeUrl = '/organizations'} active={activeUrl === '/organizations'}>
                        <svelte:fragment slot="icon">
                            <StoreSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </svelte:fragment>
                    </SidebarItem>
                </SidebarGroup>
            </SidebarWrapper>
            </Sidebar>
        {:else}
            <Sidebar {activeUrl} >
                <SidebarWrapper class="h-full">
                    <SidebarGroup>
                        {#if $authUser.user?.organizationRef !== undefined}
                            <SidebarItem label="Empresa" href="/organizations/{$authUser.user?.organizationRef?.id}" on:click={() => activeUrl = '/organizations'} active={activeUrl.startsWith('/organizations')}>
                                <svelte:fragment slot="icon">
                                    <StoreSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                </svelte:fragment>
                            </SidebarItem>
                            <SidebarItem label="Agenda" href="/guides/agenda?id={$authUser.user?.organizationRef?.id}" on:click={() => activeUrl = '/organizations'} active={activeUrl.startsWith('/organizations')}>
                                <svelte:fragment slot="icon">
                                    <CalendarMonthSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                </svelte:fragment>
                            </SidebarItem>
                            <SidebarItem label="Guias" href="/guides" on:click={() => activeUrl = '/guides'} active={activeUrl === '/guides'}>
                                <svelte:fragment slot="icon">
                                    <ProfileCardSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                </svelte:fragment>
                            </SidebarItem>
                            <SidebarItem label="Tuks" href="/tuks" on:click={() => activeUrl = '/tuks'} active={activeUrl === '/tuks'}>
                                <svelte:fragment slot="icon">
                                    <TruckSolid class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                </svelte:fragment>
                            </SidebarItem>
                        {/if}
                    </SidebarGroup>
                </SidebarWrapper>
            </Sidebar>
        {/if}
        {@render children()}
    </div>
</div>

