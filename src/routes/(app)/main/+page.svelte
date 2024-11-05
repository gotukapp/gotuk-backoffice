<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { collection, getDocs } from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    let trips = $state([])
    onMount(async () => {
        const querySnapshot = await getDocs(collection(db, "trips"));
        trips = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Trips
        <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of Flowbite products designed to help you work and play, stay organized, get answers, keep in touch, grow your business, and more.</p>
    </caption>
    <TableHead>
        <TableHeadCell>Product name</TableHeadCell>
        <TableHeadCell>Color</TableHeadCell>
        <TableHeadCell>Category</TableHeadCell>
        <TableHeadCell>Price</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each trips as trip}
            <TableBodyRow>
                <TableBodyCell>{trip.reservationId}</TableBodyCell>
                <TableBodyCell>{trip.status}</TableBodyCell>
                <TableBodyCell>{trip.date}</TableBodyCell>
                <TableBodyCell>{trip.persons}</TableBodyCell>
                <TableBodyCell>{trip.price}</TableBodyCell>
                <TableBodyCell>
                    <a href="/edit/{trips.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Edit</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
