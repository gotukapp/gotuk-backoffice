<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, getDoc, getDocs} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    let trips = $state([])
    onMount(async () => {
        const querySnapshot = await getDocs(collection(db, "trips"));
        trips = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();

                // Fetch the referenced user data
                if (postData.clientRef) {
                    const clientDoc = await getDoc(postData.clientRef);
                    postData.client = clientDoc.exists() ? clientDoc.data() : null;
                }

                if (postData.guideRef) {
                    const guideDoc = await getDoc(postData.guideRef);
                    postData.guide = guideDoc.exists() ? guideDoc.data() : null;
                }

                return {
                    id: postDoc.id,
                    ...postData
                };
            })
        );
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Trips
        <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of Flowbite products designed to help you work and play, stay organized, get answers, keep in touch, grow your business, and more.</p>
    </caption>
    <TableHead>
        <TableHeadCell>Reservation Id</TableHeadCell>
        <TableHeadCell>Client</TableHeadCell>
        <TableHeadCell>Guide</TableHeadCell>
        <TableHeadCell>Status</TableHeadCell>
        <TableHeadCell>Date</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each trips as trip}
            <TableBodyRow>
                <TableBodyCell>{trip.reservationId}</TableBodyCell>
                <TableBodyCell>{trip.client ? trip.client.name : 'N/A'}</TableBodyCell>
                <TableBodyCell>{trip.guide ? trip.guide.name : 'N/A'}</TableBodyCell>
                <TableBodyCell>{trip.status}</TableBodyCell>
                <TableBodyCell>{trip.date.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>
                    <a href="/{trips.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
