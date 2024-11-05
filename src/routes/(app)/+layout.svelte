<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { page } from '$app/stores';
    import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { ChartPieSolid, GridSolid, MailBoxSolid, UserSolid, ArrowRightToBracketOutline, EditOutline } from 'flowbite-svelte-icons';
    let spanClass = 'flex-1 ms-3 whitespace-nowrap';
    let {data, children} = $props()
</script>

<Navbar>
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
        <DropdownItem>Dashboard</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Earnings</DropdownItem>
        <DropdownDivider />
        <DropdownItem>Sign out</DropdownItem>
    </Dropdown>
    {/await}
    <NavUl>
        <NavLi href="/" active={true}>Home</NavLi>
        <NavLi href="/about">About</NavLi>
        <NavLi href="/docs/components/navbar">Navbar</NavLi>
        <NavLi href="/pricing">Pricing</NavLi>
        <NavLi href="/contact">Contact</NavLi>
    </NavUl>
</Navbar>
{@render children()}
