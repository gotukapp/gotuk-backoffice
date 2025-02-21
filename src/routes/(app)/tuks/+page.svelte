<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, onSnapshot} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {writable} from "svelte/store";

    let tuks = writable([]);


    onMount(async () => {
        const unsubscribe = onSnapshot(collection(db, "tuktuks"), (snapshot) => {
            tuks.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe(); // Cleanup on unmount
    });

</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Tuks
    </caption>
    <TableHead>
        <TableHeadCell>License Plate</TableHeadCell>
        <TableHeadCell>Seats</TableHeadCell>
        <TableHeadCell>Electric</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $tuks as tuk}
            <TableBodyRow>
                <TableBodyCell>{tuk.licensePlate}</TableBodyCell>
                <TableBodyCell>{tuk.seats}</TableBodyCell>
                <TableBodyCell>{tuk.electric}</TableBodyCell>
                <TableBodyCell>
                    <a href="/tuks/{tuk.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
