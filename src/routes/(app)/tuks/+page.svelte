<script>
    import {Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
    import {collection, onSnapshot, query, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {writable} from "svelte/store";
    let {data} = $props()
    let tuks = writable([]);

    onMount(async () => {
        const firebaseUser = await data.getFirebaseUser();
        const q = firebaseUser.isAdmin ?
            collection(db, "tuktuks") :
            query(collection(db, "tuktuks"), where("organizationRef", "==", firebaseUser.organizationRef))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            tuks.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe(); // Cleanup on unmount
    });

    async function addTuk() {

    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <div class="flex justify-between items-center w-full">
            <span>Tuks</span>
            <Button pill color="light" on:click={() => addTuk()}>Add</Button>
        </div>
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
