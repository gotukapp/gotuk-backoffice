<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, getDoc, getDocs, query, orderBy} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    let trips = $state([])
    onMount(async () => {
        const q = query(
            collection(db, "trips"),
            orderBy("creationDate", "desc")
        );
        const querySnapshot = await getDocs(q);
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

    function statusColor(status) {
        return status === 'pending' ? 'text-gray-500'
            : (status === 'booked' ? 'text-yellow-500'
                : (status === 'started' ? 'text-green-500'
                    : (status === 'canceled' ? 'text-red-500'
                        : (status === 'finished' ? 'text-blue-500' : 'text-black-500'))))
    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Trips
    </caption>
    <TableHead>
        <TableHeadCell>Reservation Id</TableHeadCell>
        <TableHeadCell>Client</TableHeadCell>
        <TableHeadCell>Guide</TableHeadCell>
        <TableHeadCell>Status</TableHeadCell>
        <TableHeadCell>Date</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Ver</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each trips as trip}
            <TableBodyRow>
                <TableBodyCell>{trip.reservationId}</TableBodyCell>
                <TableBodyCell>{trip.client ? trip.client.name : 'N/A'}</TableBodyCell>
                <TableBodyCell>{trip.guide ? trip.guide.name : 'N/A'}</TableBodyCell>
                <TableBodyCell class="{statusColor(trip.status)}">{trip.status.toUpperCase()}</TableBodyCell>
                <TableBodyCell>{trip.date.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>
                    <a href="/trips/{trip.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
<style>
    .canceled {
        color: #FF5733 !important;
    }
</style>
