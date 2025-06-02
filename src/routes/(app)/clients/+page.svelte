<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, getDocs, query, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {authUser} from '$lib/stores/authUser.js'
    import {goto} from "$app/navigation";
    let users = $state([])
    onMount(async () => {
        const firebaseUser = $authUser.user
        if (!firebaseUser?.isAdmin) {
            await goto('/organizations');
        }

        let userQuery = query(collection(db, "users"), where("clientMode", "==", true));
        const querySnapshot = await getDocs(userQuery);
        users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => !user.backoffice).sort((a, b) => {
            const nameA = a.name?.trim().toLowerCase() || '';
            const nameB = b.name?.trim().toLowerCase() || '';

            if (!nameA && nameB) return 1;
            if (nameA && !nameB) return -1;

            return nameA.localeCompare(nameB);
        });
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Clients
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>Email</TableHeadCell>
        <TableHeadCell>Nome</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Ver</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each users as user}
            <TableBodyRow>
                <TableBodyCell>{user.name}</TableBodyCell>
                <TableBodyCell>{user.email}</TableBodyCell>
                <TableBodyCell>{user.phone}</TableBodyCell>
                <TableBodyCell>
                    <a href="clients/{user.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
