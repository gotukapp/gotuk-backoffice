<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, getDocs, query, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    let {data} = $props()
    let users = $state([])
    onMount(async () => {
        const firebaseUser = await data.getFirebaseUser();
        const q = firebaseUser.isAdmin ?
            query(collection(db, "users"), where("guideMode", "==", true)) :
            query(collection(db, "users"), where("guideMode", "==", true), where("organizationRef", "==", firebaseUser.organizationRef))

        const querySnapshot = await getDocs(q);
        users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Guides
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>Email</TableHeadCell>
        <TableHeadCell>Phone</TableHeadCell>
        <TableHeadCell>Account Status</TableHeadCell>
        <TableHeadCell>Rating</TableHeadCell>
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
                <TableBodyCell>{user.accountValidated ? "Valid" : "Blocked"}</TableBodyCell>
                <TableBodyCell>{user.rating}</TableBodyCell>
                <TableBodyCell>
                    <a href="/guides/{user.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
