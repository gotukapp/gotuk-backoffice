<script>
    import {Input, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
    import {collection, getDoc, query, orderBy, onSnapshot} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {writable} from "svelte/store";
    import {authUser} from '$lib/stores/authUser.js'

    let items = writable([]);
    let searchQuery = $state('');
    let order = '';

    onMount(() => {
        const firebaseUser = $authUser.user
        if (!firebaseUser?.isAdmin) return;

        const q = query(collection(db, "trips"), orderBy("creationDate", "desc"));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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

            items.set(result);
        });

        return () => unsubscribe();
    });

    function filterTrips(item) {
        if (!searchQuery) {
            return true; // Sem busca, exibe todos os itens
        }
        return item.reservationId.toLowerCase().includes(searchQuery.toLowerCase())
            || item.client.name.toLowerCase().includes(searchQuery.toLowerCase())
            || item.guide?.name.toLowerCase().includes(searchQuery.toLowerCase())
            || item.status.toLowerCase().includes(searchQuery.toLowerCase());
    }

    function sortTrips(field) {
        const direction = order === 'asc' ? 1 : -1;

        items.sort((a, b) => {
            const valueA = getNestedValue(a, field);
            const valueB = getNestedValue(b, field);

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction * valueA.localeCompare(valueB);
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction * (valueA - valueB);
            } else if (valueA && valueB) {
                return direction * (valueA > valueB ? 1 : -1);
            }
            return direction * (valueA ? 1 : -1);
        });

        // Toggle the order
        order = order === 'asc' ? 'desc' : 'asc';
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
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
<Input
        type="text"
        bind:value={searchQuery}
        placeholder="Search"
        style="margin-top: 20px; margin-bottom: 20px"
/>
<Table placeholder="Search by maker name" hoverable={true}>
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Trips
    </caption>
    <TableHead>
        <TableHeadCell>Reservation Id</TableHeadCell>
        <TableHeadCell on:click={() => sortTrips('client.name')}>Client</TableHeadCell>
        <TableHeadCell on:click={() => sortTrips('guide.name')}>Guide</TableHeadCell>
        <TableHeadCell on:click={() => sortTrips('status')}>Status</TableHeadCell>
        <TableHeadCell on:click={() => sortTrips('date')}>Creation Date</TableHeadCell>
        <TableHeadCell on:click={() => sortTrips('date')}>Date</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Ver</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $items.filter(filterTrips) as item}
            <TableBodyRow>
                <TableBodyCell>{item.reservationId}</TableBodyCell>
                <TableBodyCell>{item.client.name}</TableBodyCell>
                <TableBodyCell>{item.guide ? item.guide.name : 'N/A'}</TableBodyCell>
                <TableBodyCell class="{statusColor(item.status)}">{item.status.toUpperCase()}</TableBodyCell>
                <TableBodyCell>{item.creationDate.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>{item.date.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>
                    <a href="/trips/{item.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
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
