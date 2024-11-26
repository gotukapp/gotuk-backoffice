<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, getDoc, getDocs, query, orderBy} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'

    let items = $state([]);
    onMount(async () => {
        const q = query(
            collection(db, "trips"),
            orderBy("creationDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        const result = await Promise.all(
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
        result.forEach(i => items.push(i))
    });

    function filterTrips(item, searchTerm) {
        console.log(searchTerm)
        if (!searchTerm) {
            return true
        }
        return item.reservationId.toLowerCase().includes(searchTerm.toLowerCase())
    }

    function statusColor(status) {
        return status === 'pending' ? 'text-gray-500'
            : (status === 'booked' ? 'text-yellow-500'
                : (status === 'started' ? 'text-green-500'
                    : (status === 'canceled' ? 'text-red-500'
                        : (status === 'finished' ? 'text-blue-500' : 'text-black-500'))))
    }
</script>
<div class="w-full">
<Table {items} placeholder="Search by maker name" hoverable={true} filter={filterTrips}>
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Trips
    </caption>
    <TableHead>
        <TableHeadCell>Reservation Id</TableHeadCell>
        <TableHeadCell sort={(a, b) => a.client.name.localeCompare(b.client.name)}>Client</TableHeadCell>
        <TableHeadCell sort={(a, b) => a.guide && b.guide ? a.guide.name.localeCompare(b.guide.name) : (a.guide ? 1 : -1)}>Guide</TableHeadCell>
        <TableHeadCell sort={(a, b) => a.status.localeCompare(b.status)}>Status</TableHeadCell>
        <TableHeadCell sort={(a, b) => a.date.toDate().toLocaleString().localeCompare(b.date.toDate().toLocaleString())}>Date</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Ver</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
            <TableBodyRow slot="row" let:item>
                <TableBodyCell>{item.reservationId}</TableBodyCell>
                <TableBodyCell>{item.client.name}</TableBodyCell>
                <TableBodyCell>{item.guide ? item.guide.name : 'N/A'}</TableBodyCell>
                <TableBodyCell class="{statusColor(item.status)}">{item.status.toUpperCase()}</TableBodyCell>
                <TableBodyCell>{item.date.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>
                    <a href="/trips/{item.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
    </TableBody>
</Table>
</div>
<style>
    .canceled {
        color: #FF5733 !important;
    }
</style>
