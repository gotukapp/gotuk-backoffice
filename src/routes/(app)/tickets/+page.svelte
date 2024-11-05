<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { collection, getDocs, getDoc } from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    let tickets = $state([])
    onMount(async () => {
        const querySnapshot = await getDocs(collection(db, "tickets"));
        tickets = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();

                // Fetch the referenced user data
                if (postData.userRef) {
                    const userDoc = await getDoc(postData.userRef);
                    postData.user = userDoc.exists() ? userDoc.data() : null;
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
        Tickets
    </caption>
    <TableHead>
        <TableHeadCell>Date</TableHeadCell>
        <TableHeadCell>Client</TableHeadCell>
        <TableHeadCell>Category</TableHeadCell>
        <TableHeadCell>Reason</TableHeadCell>
        <TableHeadCell>Subject</TableHeadCell>
        <TableHeadCell>Message</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each tickets as ticket}

            <TableBodyRow>
                <TableBodyCell>{ticket.creationDate.toDate().toLocaleString()}</TableBodyCell>
                <TableBodyCell>{ticket.user ? ticket.user.name : 'N/A'}</TableBodyCell>
                <TableBodyCell>{ticket.category}</TableBodyCell>
                <TableBodyCell>{ticket.reason}</TableBodyCell>
                <TableBodyCell>{ticket.subject}</TableBodyCell>
                <TableBodyCell>{ticket.message}</TableBodyCell>
                <TableBodyCell>
                    <a href="/edit/{ticket.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Edit</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>
