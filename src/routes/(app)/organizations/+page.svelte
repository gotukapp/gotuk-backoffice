<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, onSnapshot} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import { writable } from "svelte/store";

    let orgs = writable([]);

    onMount(async () => {
        const unsubscribe = onSnapshot(collection(db, "organizations"), (snapshot) => {
            orgs.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe(); // Cleanup on unmount
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Organizations
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $orgs as org}
            <TableBodyRow>
                <TableBodyCell>{org.name}</TableBodyCell>
                <TableBodyCell>
                    <a href="/organizations/{org.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
